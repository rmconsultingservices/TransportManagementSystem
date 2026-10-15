using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class PurchaseRequisitionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseRequisitionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseRequisitions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseRequisition>>> GetRequisitions()
        {
            return await _context.PurchaseRequisitions
                .Include(r => r.ServiceRequest)
                    .ThenInclude(sr => sr.Vehicle)
                .Include(r => r.Quotations)
                    .ThenInclude(q => q.Supplier)
                .OrderByDescending(r => r.DateRequested)
                .ToListAsync();
        }

        // POST: api/PurchaseRequisitions/5/Quotes
        [HttpPost("{id}/Quotes")]
        public async Task<ActionResult<Quotation>> AddQuotation(int id, [FromBody] Quotation quote)
        {
            var req = await _context.PurchaseRequisitions.FindAsync(id);
            if (req == null) return NotFound();

            quote.PurchaseRequisitionId = id;
            quote.DateReceived = System.DateTime.UtcNow;
            
            _context.Quotations.Add(quote);
            
            if (req.Status == "Pendiente") req.Status = "Cotizando";
            
            await _context.SaveChangesAsync();

            return Ok(quote);
        }

        // PUT: api/PurchaseRequisitions/5/SelectQuote/2
        [HttpPut("{id}/SelectQuote/{quoteId}")]
        public async Task<IActionResult> SelectQuote(int id, int quoteId)
        {
            var req = await _context.PurchaseRequisitions
                .Include(r => r.Quotations)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (req == null) return NotFound();

            var targetQuote = req.Quotations.FirstOrDefault(q => q.Id == quoteId);
            if (targetQuote == null) return NotFound("Cotización no encontrada.");

            bool willBeSelected = !targetQuote.IsSelected;

            if (!willBeSelected)
            {
                // Unselecting: reverse any active Purchase Orders linked to this requisition
                var linkedPoDetails = await _context.PurchaseOrderDetails
                    .Include(pod => pod.PurchaseOrder)
                        .ThenInclude(po => po.Details)
                    .Where(pod => pod.PurchaseRequisitionId == req.Id)
                    .ToListAsync();

                foreach (var pod in linkedPoDetails)
                {
                    var po = pod.PurchaseOrder;
                    if (po != null && po.Status != "Cancelada" && po.Status != "Anulada")
                    {
                        var hasActiveInvoice = await _context.PurchaseInvoices
                            .AnyAsync(pi => pi.PurchaseOrderId == po.Id && !pi.IsCancelled);

                        if (hasActiveInvoice)
                        {
                            return BadRequest("No se puede deseleccionar la cotización: la orden de compra ya posee una factura activa registrada.");
                        }

                        var otherRequisitionDetails = po.Details.Where(d => d.PurchaseRequisitionId != req.Id).ToList();
                        if (otherRequisitionDetails.Count == 0)
                        {
                            po.Status = "Cancelada";
                            po.OrderTotal = 0;
                        }
                        else
                        {
                            _context.PurchaseOrderDetails.Remove(pod);
                            po.OrderTotal = otherRequisitionDetails.Sum(d => d.QuantityOrdered * d.UnitPrice);
                        }
                    }
                }

                targetQuote.IsSelected = false;
            }
            else
            {
                targetQuote.IsSelected = true;
            }

            var anySelected = req.Quotations.Any(q => q.IsSelected);
            req.Status = anySelected ? "Comprada" : "Cotizando";

            await _context.SaveChangesAsync();

            return NoContent();
        }
        // DELETE: api/PurchaseRequisitions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequisition(int id)
        {
            var req = await _context.PurchaseRequisitions.FindAsync(id);
            if (req == null) return NotFound();

            if (req.Status != "Pendiente")
            {
                return BadRequest(new { message = "Solo se pueden eliminar requisiciones en estado Pendiente." });
            }

            _context.PurchaseRequisitions.Remove(req);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
