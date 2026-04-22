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
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetPurchaseOrders()
        {
            return await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                .OrderByDescending(po => po.DateCreated)
                .ToListAsync();
        }

        // GET: api/PurchaseOrders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrder>> GetPurchaseOrder(int id)
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Details)
                    .ThenInclude(d => d.PurchaseRequisition)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return NotFound();
            }

            return purchaseOrder;
        }

        // POST: api/PurchaseOrders/GenerateFromRequisitions
        public class GeneratePORequest
        {
            public int SupplierId { get; set; }
            public List<int> RequisitionIds { get; set; } = new();
        }

        [HttpPost("GenerateFromRequisitions")]
        public async Task<ActionResult<PurchaseOrder>> GenerateFromRequisitions([FromBody] GeneratePORequest request)
        {
            if (request.RequisitionIds == null || request.RequisitionIds.Count == 0)
            {
                return BadRequest("No requisitions provided.");
            }

            var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
            if (supplier == null) return NotFound("Supplier not found.");

            // Create new PO
            var po = new PurchaseOrder
            {
                SupplierId = request.SupplierId,
                DateCreated = DateTime.UtcNow,
                Status = "Pendiente por Recibir",
                OrderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}"
            };

            decimal total = 0;

            foreach (var reqId in request.RequisitionIds)
            {
                var req = await _context.PurchaseRequisitions
                    .Include(r => r.Quotations)
                    .FirstOrDefaultAsync(r => r.Id == reqId);

                if (req == null) continue; 

                // Find the selected quote for this supplier
                var selectedQuote = req.Quotations.FirstOrDefault(q => q.SupplierId == request.SupplierId && q.IsSelected);
                
                if (selectedQuote == null) {
                    // Try to auto-select the best quote if none is selected
                     selectedQuote = req.Quotations.Where(q => q.SupplierId == request.SupplierId).OrderBy(q => q.UnitPrice).FirstOrDefault();
                     if (selectedQuote != null) {
                        selectedQuote.IsSelected = true;
                     }
                }

                if (selectedQuote == null) continue; // Skip if no quote from this supplier

                po.Details.Add(new PurchaseOrderDetail
                {
                    PurchaseRequisitionId = req.Id,
                    QuantityOrdered = req.Quantity,
                    UnitPrice = selectedQuote.UnitPrice
                });

                total += (req.Quantity * selectedQuote.UnitPrice);
                req.Status = "Comprada"; 
            }

            if (po.Details.Count == 0)
            {
                return BadRequest("No valid requisitions with quotes for this supplier were found.");
            }

            po.OrderTotal = total;
            
            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();

            return Ok(po);
        }
    }
}
