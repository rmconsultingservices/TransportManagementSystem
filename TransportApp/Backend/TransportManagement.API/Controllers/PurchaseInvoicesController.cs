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
using ClosedXML.Excel;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    //[Microsoft.AspNetCore.Authorization.Authorize]
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
                .AsNoTracking()
                .AsSplitQuery()
                .Include(pi => pi.Supplier)
                .Include(pi => pi.PurchaseOrder)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.SparePart)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.UnitOfMeasure)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Vehicle)
                                .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Trailer)
                                .ThenInclude(t => t!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Vehicle)
                        .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Trailer)
                        .ThenInclude(t => t!.FleetOwner)
                .OrderByDescending(pi => pi.DateIssued)
                .ToListAsync();
        }

        // POST: api/PurchaseInvoices
        [HttpPost]
        public async Task<ActionResult<PurchaseInvoice>> PostPurchaseInvoice(PurchaseInvoice invoice)
        {
            if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            {
                return BadRequest("El número de factura es obligatorio.");
            }

            var cleanInvoiceNumber = invoice.InvoiceNumber.Trim();

            // Validate that no active invoice with the same InvoiceNumber exists for this supplier and company
            var duplicateExists = await _context.PurchaseInvoices
                .AnyAsync(pi => pi.CompanyId == invoice.CompanyId 
                             && pi.SupplierId == invoice.SupplierId 
                             && pi.InvoiceNumber.Trim().ToLower() == cleanInvoiceNumber.ToLower() 
                             && !pi.IsCancelled);

            if (duplicateExists)
            {
                return BadRequest($"Ya existe una factura activa registrada con el número '{cleanInvoiceNumber}' para este proveedor.");
            }
            // Calculate totals mathematically
            decimal subTotal = 0;
            decimal taxAmount = 0;

            foreach (var detail in invoice.Details)
            {
                if (detail.SparePartId.HasValue && detail.SparePartId.Value <= 0)
                {
                    detail.SparePartId = null;
                }

                bool isService = (detail.ItemType == "S");
                SparePart? sparePart = null;
                if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0)
                {
                    sparePart = await _context.SpareParts.FindAsync(detail.SparePartId.Value);
                    if (sparePart != null && sparePart.ItemType == "Servicio")
                    {
                        isService = true;
                        detail.ItemType = "S";
                    }
                }

                // Only update physical stock if item is a registered physical spare part ("C") and NOT a service
                if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0 && !isService && (string.IsNullOrEmpty(detail.ItemType) || detail.ItemType == "C"))
                {
                    if (sparePart != null)
                    {
                        decimal baseQuantity = await _context.GetBaseQuantityAsync(detail.SparePartId.Value, detail.UnitOfMeasureId, detail.QuantityReceived);
                        decimal multiplier = detail.QuantityReceived == 0 ? 1 : baseQuantity / detail.QuantityReceived;
                        decimal baseUnitCost = detail.UnitCost / (multiplier == 0 ? 1m : multiplier);

                        // Moving average cost calculation
                        var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                        var newIncomingValue = baseQuantity * baseUnitCost;
                        var newTotalQuantity = sparePart.StockQuantity + baseQuantity;

                        sparePart.StockQuantity = newTotalQuantity;
                        if (newTotalQuantity > 0)
                        {
                            sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                        }
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
            
            if (invoice.DateIssued == default)
            {
                invoice.DateIssued = DateTime.UtcNow;
            }

            if (string.IsNullOrEmpty(invoice.PaymentStatus))
            {
                invoice.PaymentStatus = "CXP";
            }

            // If created from a PurchaseOrder, mark the purchase order as completed
            if (invoice.PurchaseOrderId.HasValue && invoice.PurchaseOrderId.Value > 0)
            {
                var po = await _context.PurchaseOrders.FindAsync(invoice.PurchaseOrderId.Value);
                if (po != null)
                {
                    po.Status = "Completada";
                }
            }

            _context.PurchaseInvoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Link details to ServiceRequest (ticket de servicio)
            await LinkInvoiceDetailsToServiceRequestsAsync(invoice);

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

            if (existingInvoice.IsCancelled) return BadRequest("No se puede modificar una factura anulada.");

            if (string.IsNullOrWhiteSpace(updatedInvoice.InvoiceNumber))
            {
                return BadRequest("El número de factura es obligatorio.");
            }

            var cleanInvoiceNumber = updatedInvoice.InvoiceNumber.Trim();

            var duplicateExists = await _context.PurchaseInvoices
                .AnyAsync(pi => pi.Id != id
                             && pi.CompanyId == updatedInvoice.CompanyId 
                             && pi.SupplierId == updatedInvoice.SupplierId 
                             && pi.InvoiceNumber.Trim().ToLower() == cleanInvoiceNumber.ToLower() 
                             && !pi.IsCancelled);

            if (duplicateExists)
            {
                return BadRequest($"Ya existe otra factura activa registrada con el número '{cleanInvoiceNumber}' para este proveedor.");
            }

            // Revert old inventory stock
            foreach (var oldDetail in existingInvoice.Details)
            {
                if (oldDetail.SparePartId.HasValue && oldDetail.SparePartId.Value > 0 && (string.IsNullOrEmpty(oldDetail.ItemType) || oldDetail.ItemType == "C"))
                {
                    var sparePart = await _context.SpareParts.FindAsync(oldDetail.SparePartId.Value);
                    if (sparePart != null && sparePart.ItemType != "Servicio")
                    {
                        decimal oldBaseQuantity = await _context.GetBaseQuantityAsync(oldDetail.SparePartId.Value, oldDetail.UnitOfMeasureId, oldDetail.QuantityReceived);
                        sparePart.StockQuantity -= oldBaseQuantity;
                        if (sparePart.StockQuantity < 0) sparePart.StockQuantity = 0;
                    }
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
                if (detail.SparePartId.HasValue && detail.SparePartId.Value <= 0) detail.SparePartId = null;
                bool isService = (detail.ItemType == "S");
                if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0 && !isService && (string.IsNullOrEmpty(detail.ItemType) || detail.ItemType == "C"))
                {
                    var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId.Value);
                    if (sparePart != null && sparePart.ItemType != "Servicio")
                    {
                        decimal baseQuantity = await _context.GetBaseQuantityAsync(detail.SparePartId.Value, detail.UnitOfMeasureId, detail.QuantityReceived);
                        decimal multiplier = detail.QuantityReceived == 0 ? 1 : baseQuantity / detail.QuantityReceived;
                        decimal baseUnitCost = detail.UnitCost / (multiplier == 0 ? 1m : multiplier);

                        var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                        var newIncomingValue = baseQuantity * baseUnitCost;
                        var newTotalQuantity = sparePart.StockQuantity + baseQuantity;

                        sparePart.StockQuantity = newTotalQuantity;
                        if (newTotalQuantity > 0)
                        {
                            sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                        }
                    }
                }

                var lineTotal = detail.QuantityReceived * detail.UnitCost;
                var lineTax = lineTotal * (detail.TaxPercentage / 100m);
                
                subTotal += lineTotal;
                taxAmount += lineTax;

                newDetails.Add(new PurchaseInvoiceDetail
                {
                    SparePartId = (detail.SparePartId.HasValue && detail.SparePartId.Value > 0) ? detail.SparePartId : null,
                    QuantityReceived = detail.QuantityReceived,
                    UnitCost = detail.UnitCost,
                    TaxPercentage = detail.TaxPercentage,
                    UnitOfMeasureId = detail.UnitOfMeasureId,
                    PurchaseOrderDetailId = detail.PurchaseOrderDetailId,
                    PurchaseRequisitionId = detail.PurchaseRequisitionId,
                    VehicleId = detail.VehicleId,
                    TrailerId = detail.TrailerId,
                    ItemType = string.IsNullOrEmpty(detail.ItemType) ? "C" : detail.ItemType,
                    Description = detail.Description
                });
            }

            existingInvoice.Details = newDetails;
            existingInvoice.InvoiceNumber = updatedInvoice.InvoiceNumber;
            existingInvoice.ControlNumber = updatedInvoice.ControlNumber;
            existingInvoice.SupplierId = updatedInvoice.SupplierId;
            existingInvoice.DateIssued = updatedInvoice.DateIssued;
            existingInvoice.PurchaseOrderId = updatedInvoice.PurchaseOrderId;
            existingInvoice.SubTotal = subTotal;
            existingInvoice.TaxAmount = taxAmount;
            existingInvoice.TotalAmount = subTotal + taxAmount;
            existingInvoice.PaymentStatus = updatedInvoice.PaymentStatus ?? existingInvoice.PaymentStatus;
            existingInvoice.PaymentDate = updatedInvoice.PaymentDate ?? existingInvoice.PaymentDate;
            existingInvoice.PaymentMethod = updatedInvoice.PaymentMethod ?? existingInvoice.PaymentMethod;
            existingInvoice.PaymentReference = updatedInvoice.PaymentReference ?? existingInvoice.PaymentReference;
            existingInvoice.AmountPaid = updatedInvoice.AmountPaid;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DTO for recording payments
        public class RecordPaymentDto
        {
            public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
            public string PaymentMethod { get; set; } = "Transferencia";
            public string? PaymentReference { get; set; }
            public decimal AmountPaid { get; set; }
        }

        // POST: api/PurchaseInvoices/{id}/record-payment
        [HttpPost("{id}/record-payment")]
        public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordPaymentDto paymentDto)
        {
            var invoice = await _context.PurchaseInvoices.FindAsync(id);
            if (invoice == null) return NotFound("Factura no encontrada.");

            if (invoice.IsCancelled) return BadRequest("No se puede registrar pagos a una factura anulada.");

            if (paymentDto.AmountPaid <= 0) return BadRequest("El monto del pago debe ser mayor a 0.");

            invoice.AmountPaid += paymentDto.AmountPaid;
            if (invoice.AmountPaid >= invoice.TotalAmount)
            {
                invoice.AmountPaid = invoice.TotalAmount;
                invoice.PaymentStatus = "PAGADO";
            }
            else
            {
                invoice.PaymentStatus = "PARCIAL";
            }

            invoice.PaymentDate = paymentDto.PaymentDate;
            invoice.PaymentMethod = paymentDto.PaymentMethod;
            invoice.PaymentReference = paymentDto.PaymentReference;

            await _context.SaveChangesAsync();
            return Ok(invoice);
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

            // 1. Revert stock for physical parts (not services)
            foreach (var detail in invoice.Details)
            {
                bool isService = (detail.ItemType == "S");
                if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0 && !isService && (string.IsNullOrEmpty(detail.ItemType) || detail.ItemType == "C"))
                {
                    var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId.Value);
                    if (sparePart != null && sparePart.ItemType != "Servicio")
                    {
                        decimal baseQuantity = await _context.GetBaseQuantityAsync(detail.SparePartId.Value, detail.UnitOfMeasureId, detail.QuantityReceived);
                        sparePart.StockQuantity -= baseQuantity;
                        if (sparePart.StockQuantity < 0) sparePart.StockQuantity = 0;
                    }
                }
            }

            // 2. Remove any items injected into Service Requests (tickets)
            var detailIds = invoice.Details.Select(d => d.Id).ToList();
            if (detailIds.Any())
            {
                var linkedServiceParts = await _context.ServiceExecutionSpareParts
                    .Where(sp => sp.PurchaseInvoiceDetailId.HasValue && detailIds.Contains(sp.PurchaseInvoiceDetailId.Value))
                    .ToListAsync();

                if (linkedServiceParts.Any())
                {
                    _context.ServiceExecutionSpareParts.RemoveRange(linkedServiceParts);
                }
            }

            // 3. Revert Purchase Order status back to "Pendiente por Recibir"
            if (invoice.PurchaseOrderId.HasValue && invoice.PurchaseOrderId.Value > 0)
            {
                var po = await _context.PurchaseOrders.FindAsync(invoice.PurchaseOrderId.Value);
                if (po != null)
                {
                    po.Status = "Pendiente por Recibir";
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

            var cleanInvoiceNumber = invoice.InvoiceNumber?.Trim() ?? string.Empty;
            var duplicateActiveExists = await _context.PurchaseInvoices
                .AnyAsync(pi => pi.Id != invoice.Id
                             && pi.CompanyId == invoice.CompanyId 
                             && pi.SupplierId == invoice.SupplierId 
                             && pi.InvoiceNumber.Trim().ToLower() == cleanInvoiceNumber.ToLower() 
                             && !pi.IsCancelled);

            if (duplicateActiveExists)
            {
                return BadRequest($"No se puede reactivar: ya existe otra factura activa registrada con el número '{cleanInvoiceNumber}' para este proveedor.");
            }

            invoice.IsCancelled = false;

            // 1. Re-apply inventory stock for physical parts
            foreach (var detail in invoice.Details)
            {
                bool isService = (detail.ItemType == "S");
                if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0 && !isService && (string.IsNullOrEmpty(detail.ItemType) || detail.ItemType == "C"))
                {
                    var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId.Value);
                    if (sparePart != null && sparePart.ItemType != "Servicio")
                    {
                        decimal baseQuantity = await _context.GetBaseQuantityAsync(detail.SparePartId.Value, detail.UnitOfMeasureId, detail.QuantityReceived);
                        decimal multiplier = detail.QuantityReceived == 0 ? 1 : baseQuantity / detail.QuantityReceived;
                        decimal baseUnitCost = detail.UnitCost / (multiplier == 0 ? 1m : multiplier);

                        var currentTotalValue = sparePart.StockQuantity * sparePart.UnitCost;
                        var newIncomingValue = baseQuantity * baseUnitCost;
                        var newTotalQuantity = sparePart.StockQuantity + baseQuantity;

                        sparePart.StockQuantity = newTotalQuantity;
                        if (newTotalQuantity > 0)
                        {
                            sparePart.UnitCost = (currentTotalValue + newIncomingValue) / newTotalQuantity;
                        }
                    }
                }
            }

            // 2. Re-mark Purchase Order status back to "Completada"
            if (invoice.PurchaseOrderId.HasValue && invoice.PurchaseOrderId.Value > 0)
            {
                var po = await _context.PurchaseOrders.FindAsync(invoice.PurchaseOrderId.Value);
                if (po != null)
                {
                    po.Status = "Completada";
                }
            }

            await _context.SaveChangesAsync();

            // 3. Re-inject items and services into Service Requests (tickets)
            await LinkInvoiceDetailsToServiceRequestsAsync(invoice);

            return NoContent();
        }

        private async Task LinkInvoiceDetailsToServiceRequestsAsync(PurchaseInvoice invoice)
        {
            if (invoice.Details == null || !invoice.Details.Any()) return;

            foreach (var detail in invoice.Details)
            {
                int? reqId = detail.PurchaseRequisitionId;
                if (!reqId.HasValue && detail.PurchaseOrderDetailId.HasValue && detail.PurchaseOrderDetailId.Value > 0)
                {
                    var pod = await _context.PurchaseOrderDetails.FindAsync(detail.PurchaseOrderDetailId.Value);
                    if (pod != null && pod.PurchaseRequisitionId > 0)
                    {
                        reqId = pod.PurchaseRequisitionId;
                    }
                }

                if (!reqId.HasValue && invoice.PurchaseOrderId.HasValue && invoice.PurchaseOrderId.Value > 0)
                {
                    var poDetails = await _context.PurchaseOrderDetails
                        .Where(pod => pod.PurchaseOrderId == invoice.PurchaseOrderId.Value)
                        .ToListAsync();

                    if (poDetails.Count == 1 && poDetails[0].PurchaseRequisitionId > 0)
                    {
                        reqId = poDetails[0].PurchaseRequisitionId;
                    }
                }

                if (reqId.HasValue && reqId.Value > 0)
                {
                    var req = await _context.PurchaseRequisitions
                        .Include(r => r.ServiceRequest)
                            .ThenInclude(sr => sr!.Execution)
                        .FirstOrDefaultAsync(r => r.Id == reqId.Value);

                    if (req?.ServiceRequest != null)
                    {
                        var sReq = req.ServiceRequest;
                        if (sReq.Execution == null)
                        {
                            sReq.Execution = new ServiceExecution
                            {
                                ServiceRequestId = sReq.Id,
                                CompanyId = invoice.CompanyId
                            };
                            _context.ServiceExecutions.Add(sReq.Execution);
                            await _context.SaveChangesAsync();
                        }

                        // Prevent duplicate injection
                        bool alreadyLinked = await _context.ServiceExecutionSpareParts
                            .AnyAsync(sp => sp.PurchaseInvoiceDetailId == detail.Id);

                        if (!alreadyLinked)
                        {
                            bool isService = (detail.ItemType == "S");
                            string desc = detail.Description ?? string.Empty;
                            if (detail.SparePartId.HasValue && detail.SparePartId.Value > 0)
                            {
                                var sp = await _context.SpareParts.FindAsync(detail.SparePartId.Value);
                                if (sp != null)
                                {
                                    if (string.IsNullOrWhiteSpace(desc)) desc = sp.Name;
                                    if (sp.ItemType == "Servicio") isService = true;
                                }
                            }
                            if (string.IsNullOrWhiteSpace(desc))
                            {
                                desc = req.PartNameOrDescription;
                            }

                            var usedItem = new ServiceExecutionSparePart
                            {
                                CompanyId = invoice.CompanyId,
                                ServiceExecutionId = sReq.Execution.Id,
                                SparePartId = (detail.SparePartId.HasValue && detail.SparePartId.Value > 0) ? detail.SparePartId : null,
                                Quantity = detail.QuantityReceived > 0 ? detail.QuantityReceived : 1,
                                UnitCost = detail.UnitCost,
                                UnitOfMeasureId = detail.UnitOfMeasureId,
                                ItemType = isService ? "S" : "C",
                                Description = desc,
                                PurchaseInvoiceDetailId = detail.Id
                            };

                            _context.ServiceExecutionSpareParts.Add(usedItem);
                        }
                    }
                }
            }
            await _context.SaveChangesAsync();
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

        // GET: api/PurchaseInvoices/expenses-sheet
        [HttpGet("expenses-sheet")]
        public async Task<ActionResult<ExpensesSheetResponseDto>> GetExpensesSheet(
            [FromQuery] DateTime? startDate, 
            [FromQuery] DateTime? endDate)
        {
            var query = _context.PurchaseInvoices
                .AsNoTracking()
                .AsSplitQuery()
                .Include(pi => pi.Supplier)
                .Include(pi => pi.PurchaseOrder)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.SparePart)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Vehicle)
                                .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Trailer)
                                .ThenInclude(t => t!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Vehicle)
                        .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Trailer)
                        .ThenInclude(t => t!.FleetOwner)
                .Where(pi => !pi.IsCancelled);

            if (startDate.HasValue)
                query = query.Where(pi => pi.DateIssued >= startDate.Value.Date);
            if (endDate.HasValue)
                query = query.Where(pi => pi.DateIssued <= endDate.Value.Date.AddDays(1).AddTicks(-1));

            var invoices = await query.OrderBy(pi => pi.DateIssued).ToListAsync();

            var company = await _context.Companies.FindAsync(_context.CurrentCompanyId);
            string companyName = company?.Name ?? "TRANSPORMETALS, C.A.";

            string periodText = startDate.HasValue && endDate.HasValue
                ? $"Período: {startDate.Value:dd/MM/yyyy} al {endDate.Value:dd/MM/yyyy}"
                : DateTime.UtcNow.ToString("MMMM-yyyy", new System.Globalization.CultureInfo("es-ES")).ToUpper();

            var items = new List<ExpensesSheetItemDto>();
            decimal totalSpent = 0;
            decimal totalPaid = 0;
            decimal totalPendingCxp = 0;
            var invoiceIds = new HashSet<int>();

            foreach (var inv in invoices)
            {
                invoiceIds.Add(inv.Id);
                string status = (inv.PaymentStatus?.ToUpper() == "PAGADO") ? "PAGADO" : "CXP";

                foreach (var d in inv.Details)
                {
                    string tipo = (d.ItemType == "S" || (d.SparePart != null && d.SparePart.ItemType != null && d.SparePart.ItemType.ToLower().Contains("servicio"))) ? "S" : "C";
                    string desc = !string.IsNullOrWhiteSpace(d.Description) 
                        ? d.Description 
                        : (d.SparePart?.Name ?? d.PurchaseRequisition?.PartNameOrDescription ?? "SIN DESCRIPCIÓN");

                    string reqNum = d.PurchaseRequisitionId.HasValue 
                        ? $"R.{d.PurchaseRequisition?.DateRequested:ddMMyy}-{d.PurchaseRequisitionId.Value}" 
                        : "S/N";

                    decimal cost = d.QuantityReceived * d.UnitCost;
                    totalSpent += cost;
                    if (status == "PAGADO")
                        totalPaid += cost;
                    else
                        totalPendingCxp += cost;

                    string pagadoDia = (inv.PaymentDate.HasValue && status == "PAGADO") 
                        ? inv.PaymentDate.Value.ToString("dd/MM/yyyy") 
                        : "";

                    string vehPlate = "STOCK / ALMACÉN";
                    string empName = companyName;
                    var veh = d.Vehicle ?? d.PurchaseRequisition?.ServiceRequest?.Vehicle;
                    var trailer = d.Trailer ?? d.PurchaseRequisition?.ServiceRequest?.Trailer;

                    if (veh != null)
                    {
                        vehPlate = $"{veh.Brand} {veh.LicensePlate}".Trim();
                        if (veh.FleetOwner != null) empName = veh.FleetOwner.Name;
                    }
                    else if (trailer != null)
                    {
                        vehPlate = $"REMOLQUE {trailer.LicensePlate}".Trim();
                        if (trailer.FleetOwner != null) empName = trailer.FleetOwner.Name;
                    }

                    items.Add(new ExpensesSheetItemDto
                    {
                        InvoiceId = inv.Id,
                        DetailId = d.Id,
                        FechaCompra = inv.DateIssued.ToString("dd/MM/yyyy"),
                        Tipo = tipo,
                        Estatus = status,
                        Descripcion = desc,
                        Modelo = d.SparePart?.Model ?? "S/M",
                        Marca = d.SparePart?.Brand ?? "S/M",
                        Cantidad = d.QuantityReceived,
                        ReqCompra = reqNum,
                        NumeroFactura = inv.InvoiceNumber,
                        Proveedor = inv.Supplier?.Name ?? "PROVEEDOR GENERAL",
                        CostoUnitario = d.UnitCost,
                        CostoTotal = cost,
                        FechaRecibido = inv.DateIssued.ToString("dd/MM/yyyy"),
                        PagadoDia = pagadoDia,
                        FormaPago = !string.IsNullOrWhiteSpace(inv.PaymentMethod) ? inv.PaymentMethod.ToUpper() : "",
                        TotalFactura = inv.TotalAmount,
                        Vehiculo = vehPlate,
                        Empresa = empName
                    });
                }
            }

            var response = new ExpensesSheetResponseDto
            {
                CompanyName = companyName,
                PeriodText = periodText,
                Summary = new ExpensesSheetSummaryDto
                {
                    TotalItems = items.Count,
                    TotalInvoices = invoiceIds.Count,
                    TotalSpent = totalSpent,
                    TotalPaid = totalPaid,
                    TotalPendingCxp = totalPendingCxp
                },
                Items = items
            };

            return Ok(response);
        }

        // GET: api/PurchaseInvoices/export-expenses-sheet
        [HttpGet("export-expenses-sheet")]
        public async Task<IActionResult> ExportExpensesSheet(
            [FromQuery] DateTime? startDate, 
            [FromQuery] DateTime? endDate)
        {
            var query = _context.PurchaseInvoices
                .AsNoTracking()
                .AsSplitQuery()
                .Include(pi => pi.Supplier)
                .Include(pi => pi.PurchaseOrder)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.SparePart)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Vehicle)
                                .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                        .ThenInclude(pr => pr!.ServiceRequest)
                            .ThenInclude(sr => sr!.Trailer)
                                .ThenInclude(t => t!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Vehicle)
                        .ThenInclude(v => v!.FleetOwner)
                .Include(pi => pi.Details)
                    .ThenInclude(d => d.Trailer)
                        .ThenInclude(t => t!.FleetOwner)
                .Where(pi => !pi.IsCancelled);

            if (startDate.HasValue)
                query = query.Where(pi => pi.DateIssued >= startDate.Value.Date);
            if (endDate.HasValue)
                query = query.Where(pi => pi.DateIssued <= endDate.Value.Date.AddDays(1).AddTicks(-1));

            var invoices = await query.OrderBy(pi => pi.DateIssued).ToListAsync();

            // Fetch current company name
            var company = await _context.Companies.FindAsync(_context.CurrentCompanyId);
            string companyName = company?.Name ?? "TRANSPORMETALS, C.A.";

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("GASTOS Y COMPRAS");

            // Row 1 & 2: Merged Title Banner
            worksheet.Range("A1:R2").Merge();
            var titleCell = worksheet.Cell("A1");
            titleCell.Value = companyName.ToUpper();
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 16;
            titleCell.Style.Font.FontColor = XLColor.Black;
            titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            titleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            worksheet.Range("A1:R2").Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0); // Yellow gold

            // Row 3: Period
            string periodText = startDate.HasValue && endDate.HasValue
                ? $"Período: {startDate.Value:dd/MM/yyyy} al {endDate.Value:dd/MM/yyyy}"
                : DateTime.UtcNow.ToString("MMMM-yyyy", new System.Globalization.CultureInfo("es-ES")).ToUpper();
            worksheet.Range("A3:R3").Merge();
            var periodCell = worksheet.Cell("A3");
            periodCell.Value = periodText;
            periodCell.Style.Font.Bold = true;
            periodCell.Style.Font.FontSize = 11;
            periodCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A3:R3").Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0);

            // Row 4: Subtitle
            worksheet.Range("A4:R4").Merge();
            var subtitleCell = worksheet.Cell("A4");
            subtitleCell.Value = "REGISTRO DE GASTOS, SERVICIOS Y COMPRAS DE REPUESTOS E INSUMOS";
            subtitleCell.Style.Font.Bold = true;
            subtitleCell.Style.Font.FontSize = 12;
            subtitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A4:R4").Style.Fill.BackgroundColor = XLColor.FromArgb(217, 217, 217); // Light Gray

            // Row 6: Section Headers
            // Section 1: A6:M6 -> DATOS DE GASTO, COMPRA O SERVICIO
            worksheet.Range("A6:M6").Merge();
            var sec1 = worksheet.Cell("A6");
            sec1.Value = "DATOS DE GASTO, COMPRA O SERVICIO";
            sec1.Style.Font.Bold = true;
            sec1.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A6:M6").Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0);

            // Section 2: N6:P6 -> DATOS DE PAGO
            worksheet.Range("N6:P6").Merge();
            var sec2 = worksheet.Cell("N6");
            sec2.Value = "DATOS DE PAGO";
            sec2.Style.Font.Bold = true;
            sec2.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("N6:P6").Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0);

            // Section 3: Q6:R6 -> VEH. Y EMPRESA
            worksheet.Range("Q6:R6").Merge();
            var sec3 = worksheet.Cell("Q6");
            sec3.Value = "VEH. Y EMPRESA";
            sec3.Style.Font.Bold = true;
            sec3.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("Q6:R6").Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0);

            // Row 7: Column Titles
            string[] headers = new string[]
            {
                "FECHA COMPRA",      // Col 1 (A)
                "TIPO",              // Col 2 (B) (C: Compra, S: Servicio)
                "ESTATUS",           // Col 3 (C) (CXP / PAGADO)
                "DESCRIPCION",       // Col 4 (D)
                "MODELO",            // Col 5 (E)
                "MARCA",             // Col 6 (F)
                "CANTIDAD",          // Col 7 (G)
                "REQ. COMPRA",       // Col 8 (H)
                "Nº FACTURA / NOTA", // Col 9 (I)
                "PROVEEDOR",         // Col 10 (J)
                "C.U $",             // Col 11 (K)
                "TOTAL COST $",      // Col 12 (L)
                "FECHA RECIBIDO",    // Col 13 (M)
                "PAGADO DIA",        // Col 14 (N)
                "FORMA DE PAGO",     // Col 15 (O)
                "TOTAL FACTURA",     // Col 16 (P)
                "VEHICULO",          // Col 17 (Q)
                "EMPRESA"            // Col 18 (R)
            };

            for (int col = 1; col <= headers.Length; col++)
            {
                var cell = worksheet.Cell(7, col);
                cell.Value = headers[col - 1];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontSize = 10;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(255, 192, 0);
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            int currentRow = 8;
            foreach (var inv in invoices)
            {
                foreach (var d in inv.Details)
                {
                    worksheet.Cell(currentRow, 1).Value = inv.DateIssued.ToString("dd/MM/yyyy");
                    
                    // TIPO: C for Purchase, S for Service
                    string tipo = (d.ItemType == "S" || (d.SparePart != null && d.SparePart.ItemType != null && d.SparePart.ItemType.ToLower().Contains("servicio"))) ? "S" : "C";
                    worksheet.Cell(currentRow, 2).Value = tipo;
                    worksheet.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // ESTATUS: CXP or PAGADO
                    string status = (inv.PaymentStatus?.ToUpper() == "PAGADO") ? "PAGADO" : "CXP";
                    var statusCell = worksheet.Cell(currentRow, 3);
                    statusCell.Value = status;
                    statusCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    statusCell.Style.Font.Bold = true;
                    if (status == "CXP")
                    {
                        statusCell.Style.Fill.BackgroundColor = XLColor.FromArgb(192, 0, 0); // Dark Red
                        statusCell.Style.Font.FontColor = XLColor.White;
                    }
                    else
                    {
                        statusCell.Style.Fill.BackgroundColor = XLColor.FromArgb(226, 239, 218); // Soft Green
                        statusCell.Style.Font.FontColor = XLColor.FromArgb(56, 86, 35);
                    }

                    // DESCRIPCION
                    string desc = !string.IsNullOrWhiteSpace(d.Description) 
                        ? d.Description 
                        : (d.SparePart?.Name ?? d.PurchaseRequisition?.PartNameOrDescription ?? "SIN DESCRIPCIÓN");
                    worksheet.Cell(currentRow, 4).Value = desc;

                    // MODELO
                    worksheet.Cell(currentRow, 5).Value = d.SparePart?.Model ?? "S/M";

                    // MARCA
                    worksheet.Cell(currentRow, 6).Value = d.SparePart?.Brand ?? "S/M";

                    // CANTIDAD
                    var qtyCell = worksheet.Cell(currentRow, 7);
                    qtyCell.Value = d.QuantityReceived;
                    qtyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // REQ. COMPRA
                    string reqNum = d.PurchaseRequisitionId.HasValue 
                        ? $"R.{d.PurchaseRequisition?.DateRequested:ddMMyy}-{d.PurchaseRequisitionId.Value}" 
                        : "S/N";
                    var reqCell = worksheet.Cell(currentRow, 8);
                    reqCell.Value = reqNum;
                    reqCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // Nº FACTURA / NOTA
                    worksheet.Cell(currentRow, 9).Value = inv.InvoiceNumber;

                    // PROVEEDOR
                    worksheet.Cell(currentRow, 10).Value = inv.Supplier?.Name ?? "PROVEEDOR GENERAL";

                    // C.U $
                    var cuCell = worksheet.Cell(currentRow, 11);
                    cuCell.Value = d.UnitCost;
                    cuCell.Style.NumberFormat.Format = "$ #,##0.00";

                    // TOTAL COST $
                    var totalCostCell = worksheet.Cell(currentRow, 12);
                    totalCostCell.Value = d.QuantityReceived * d.UnitCost;
                    totalCostCell.Style.NumberFormat.Format = "$ #,##0.00";
                    totalCostCell.Style.Font.Bold = true;

                    // FECHA RECIBIDO
                    worksheet.Cell(currentRow, 13).Value = inv.DateIssued.ToString("dd/MM/yyyy");
                    worksheet.Cell(currentRow, 13).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // DATOS DE PAGO
                    // PAGADO DIA
                    if (inv.PaymentDate.HasValue && status == "PAGADO")
                    {
                        worksheet.Cell(currentRow, 14).Value = inv.PaymentDate.Value.ToString("dd/MM/yyyy");
                        worksheet.Cell(currentRow, 14).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    }
                    else
                    {
                        worksheet.Cell(currentRow, 14).Value = "";
                    }

                    // FORMA DE PAGO
                    worksheet.Cell(currentRow, 15).Value = !string.IsNullOrWhiteSpace(inv.PaymentMethod) ? inv.PaymentMethod.ToUpper() : "";

                    // TOTAL FACTURA
                    var totalInvCell = worksheet.Cell(currentRow, 16);
                    totalInvCell.Value = inv.TotalAmount;
                    totalInvCell.Style.NumberFormat.Format = "$ #,##0.00";

                    // VEHICULO & EMPRESA
                    string vehPlate = "STOCK / ALMACÉN";
                    string empName = companyName;

                    var veh = d.Vehicle ?? d.PurchaseRequisition?.ServiceRequest?.Vehicle;
                    var trailer = d.Trailer ?? d.PurchaseRequisition?.ServiceRequest?.Trailer;

                    if (veh != null)
                    {
                        vehPlate = $"{veh.Brand} {veh.LicensePlate}".Trim();
                        if (veh.FleetOwner != null) empName = veh.FleetOwner.Name;
                    }
                    else if (trailer != null)
                    {
                        vehPlate = $"REMOLQUE {trailer.LicensePlate}".Trim();
                        if (trailer.FleetOwner != null) empName = trailer.FleetOwner.Name;
                    }

                    worksheet.Cell(currentRow, 17).Value = vehPlate;
                    worksheet.Cell(currentRow, 18).Value = empName;

                    // Add thin borders to data row
                    worksheet.Range(currentRow, 1, currentRow, headers.Length).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    worksheet.Range(currentRow, 1, currentRow, headers.Length).Style.Border.InsideBorder = XLBorderStyleValues.Thin;

                    currentRow++;
                }
            }

            // Totals Row
            var totalRow = currentRow;
            worksheet.Cell(totalRow, 4).Value = "TOTAL GENERAL:";
            worksheet.Cell(totalRow, 4).Style.Font.Bold = true;
            worksheet.Cell(totalRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            if (currentRow > 8)
            {
                worksheet.Cell(totalRow, 12).FormulaA1 = $"SUM(L8:L{currentRow - 1})";
                worksheet.Cell(totalRow, 12).Style.Font.Bold = true;
                worksheet.Cell(totalRow, 12).Style.NumberFormat.Format = "$ #,##0.00";
            }

            worksheet.Range(totalRow, 1, totalRow, headers.Length).Style.Fill.BackgroundColor = XLColor.FromArgb(242, 242, 242);
            worksheet.Range(totalRow, 1, totalRow, headers.Length).Style.Border.TopBorder = XLBorderStyleValues.Medium;
            worksheet.Range(totalRow, 1, totalRow, headers.Length).Style.Border.BottomBorder = XLBorderStyleValues.Double;

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var fileContent = stream.ToArray();

            string fileName = $"Registro_Gastos_Compras_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
            return File(fileContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
    }

    public class ExpensesSheetItemDto
    {
        public int InvoiceId { get; set; }
        public int DetailId { get; set; }
        public string FechaCompra { get; set; } = string.Empty;
        public string Tipo { get; set; } = "C";
        public string Estatus { get; set; } = "CXP";
        public string Descripcion { get; set; } = string.Empty;
        public string Modelo { get; set; } = "S/M";
        public string Marca { get; set; } = "S/M";
        public decimal Cantidad { get; set; }
        public string ReqCompra { get; set; } = "S/N";
        public string NumeroFactura { get; set; } = string.Empty;
        public string Proveedor { get; set; } = string.Empty;
        public decimal CostoUnitario { get; set; }
        public decimal CostoTotal { get; set; }
        public string FechaRecibido { get; set; } = string.Empty;
        public string PagadoDia { get; set; } = string.Empty;
        public string FormaPago { get; set; } = string.Empty;
        public decimal TotalFactura { get; set; }
        public string Vehiculo { get; set; } = "STOCK / ALMACÉN";
        public string Empresa { get; set; } = string.Empty;
    }

    public class ExpensesSheetSummaryDto
    {
        public int TotalItems { get; set; }
        public int TotalInvoices { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal TotalPendingCxp { get; set; }
    }

    public class ExpensesSheetResponseDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string PeriodText { get; set; } = string.Empty;
        public ExpensesSheetSummaryDto Summary { get; set; } = new();
        public List<ExpensesSheetItemDto> Items { get; set; } = new();
    }
}
