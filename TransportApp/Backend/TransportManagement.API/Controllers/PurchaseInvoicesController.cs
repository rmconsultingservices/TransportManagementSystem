using Microsoft.AspNetCore.Mvc;
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
    }
}
