using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class PurchaseInvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseInvoicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseInvoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseInvoice>>> GetPurchaseInvoices()
        {
            return await _context.PurchaseInvoices
                .Include(pi => pi.Supplier)
                .Include(pi => pi.Details)
                .OrderByDescending(pi => pi.DateIssued)
                .ToListAsync();
        }

        // POST: api/PurchaseInvoices
        [HttpPost]
        public async Task<ActionResult<PurchaseInvoice>> PostPurchaseInvoice(PurchaseInvoice invoice)
        {
            // Calculate totals mathematically just to be safe
            decimal subTotal = 0;
            decimal taxAmount = 0;

            foreach (var detail in invoice.Details)
            {
                // Find and update the underlying SparePart stock in the actual Inventory
                var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId);
                if (sparePart != null)
                {
                    // Calculate moving average cost
                    var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                    var newIncomingValue = detail.QuantityReceived * detail.UnitCost;
                    var newTotalQuantity = sparePart.StockQuantity + detail.QuantityReceived;

                    sparePart.StockQuantity = newTotalQuantity;
                    if (newTotalQuantity > 0)
                    {
                        sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                    }
                }

                var lineTotal = detail.QuantityReceived * detail.UnitCost;
                var lineTax = lineTotal * (detail.TaxPercentage / 100m);
                
                subTotal += lineTotal;
                taxAmount += lineTax;
            }

            invoice.SubTotal = subTotal;
            invoice.TaxAmount = taxAmount;
            invoice.TotalAmount = subTotal + taxAmount;
            invoice.DateIssued = DateTime.UtcNow;

            _context.PurchaseInvoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPurchaseInvoices", new { id = invoice.Id }, invoice);
        }

        // PUT: api/PurchaseInvoices/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPurchaseInvoice(int id, PurchaseInvoice updatedInvoice)
        {
            if (id != updatedInvoice.Id) return BadRequest();

            var existingInvoice = await _context.PurchaseInvoices
                .Include(pi => pi.Details)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (existingInvoice == null) return NotFound();

            if (existingInvoice.IsCancelled) return BadRequest("Cannot modify a cancelled invoice.");

            // Revert old inventory stock
            foreach (var oldDetail in existingInvoice.Details)
            {
                var sparePart = await _context.SpareParts.FindAsync(oldDetail.SparePartId);
                if (sparePart != null)
                {
                    sparePart.StockQuantity -= oldDetail.QuantityReceived;
                    if (sparePart.StockQuantity < 0) sparePart.StockQuantity = 0;
                }
            }

            // Remove old details
            _context.PurchaseInvoiceDetails.RemoveRange(existingInvoice.Details);

            // Apply new details and update stock
            decimal subTotal = 0;
            decimal taxAmount = 0;

            var newDetails = new List<PurchaseInvoiceDetail>();
            foreach (var detail in updatedInvoice.Details)
            {
                var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId);
                if (sparePart != null)
                {
                    var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                    var newIncomingValue = detail.QuantityReceived * detail.UnitCost;
                    var newTotalQuantity = sparePart.StockQuantity + detail.QuantityReceived;

                    sparePart.StockQuantity = newTotalQuantity;
                    if (newTotalQuantity > 0)
                    {
                        sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                    }
                }

                var lineTotal = detail.QuantityReceived * detail.UnitCost;
                var lineTax = lineTotal * (detail.TaxPercentage / 100m);
                
                subTotal += lineTotal;
                taxAmount += lineTax;

                newDetails.Add(new PurchaseInvoiceDetail
                {
                    SparePartId = detail.SparePartId,
                    QuantityReceived = detail.QuantityReceived,
                    UnitCost = detail.UnitCost,
                    TaxPercentage = detail.TaxPercentage
                });
            }

            existingInvoice.Details = newDetails;
            existingInvoice.InvoiceNumber = updatedInvoice.InvoiceNumber;
            existingInvoice.ControlNumber = updatedInvoice.ControlNumber;
            existingInvoice.SupplierId = updatedInvoice.SupplierId;
            existingInvoice.DateIssued = updatedInvoice.DateIssued;
            existingInvoice.SubTotal = subTotal;
            existingInvoice.TaxAmount = taxAmount;
            existingInvoice.TotalAmount = subTotal + taxAmount;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/PurchaseInvoices/{id}/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelPurchaseInvoice(int id)
        {
            var invoice = await _context.PurchaseInvoices
                .Include(pi => pi.Details)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (invoice == null) return NotFound();
            if (invoice.IsCancelled) return BadRequest("Invoice is already cancelled.");

            invoice.IsCancelled = true;

            foreach (var detail in invoice.Details)
            {
                var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId);
                if (sparePart != null)
                {
                    sparePart.StockQuantity -= detail.QuantityReceived;
                    if (sparePart.StockQuantity < 0) sparePart.StockQuantity = 0;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/PurchaseInvoices/{id}/reactivate
        [HttpPost("{id}/reactivate")]
        public async Task<IActionResult> ReactivatePurchaseInvoice(int id)
        {
            var invoice = await _context.PurchaseInvoices
                .Include(pi => pi.Details)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (invoice == null) return NotFound();
            if (!invoice.IsCancelled) return BadRequest("Invoice is not cancelled.");

            invoice.IsCancelled = false;

            foreach (var detail in invoice.Details)
            {
                var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId);
                if (sparePart != null)
                {
                    var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                    var newIncomingValue = detail.QuantityReceived * detail.UnitCost;
                    var newTotalQuantity = sparePart.StockQuantity + detail.QuantityReceived;

                    sparePart.StockQuantity = newTotalQuantity;
                    if (newTotalQuantity > 0)
                    {
                        sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/PurchaseInvoices/{id}/attachment
        [HttpPost("{id}/attachment")]
        public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File is missing.");

            var invoice = await _context.PurchaseInvoices.FindAsync(id);
            if (invoice == null) return NotFound();

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "invoices");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"invoice_{id}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            invoice.AttachmentUrl = $"/uploads/invoices/{uniqueFileName}";
            await _context.SaveChangesAsync();

            return Ok(new { AttachmentUrl = invoice.AttachmentUrl });
        }
    }
}
