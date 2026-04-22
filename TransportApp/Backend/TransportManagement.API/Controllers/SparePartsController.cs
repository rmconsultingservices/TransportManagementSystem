using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class SparePartsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SparePartsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SpareParts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SparePart>>> GetSpareParts()
        {
            return await _context.SpareParts.Where(s => s.IsActive).ToListAsync();
        }

        // GET: api/SpareParts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SparePart>> GetSparePart(int id)
        {
            var sparePart = await _context.SpareParts.FindAsync(id);

            if (sparePart == null || !sparePart.IsActive)
            {
                return NotFound();
            }

            return sparePart;
        }

        // PUT: api/SpareParts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSparePart(int id, SparePart sparePart)
        {
            if (id != sparePart.Id)
            {
                return BadRequest();
            }

            _context.Entry(sparePart).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SparePartExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/SpareParts
        [HttpPost]
        public async Task<ActionResult<SparePart>> PostSparePart(SparePart sparePart)
        {
            _context.SpareParts.Add(sparePart);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSparePart", new { id = sparePart.Id }, sparePart);
        }

        // DELETE: api/SpareParts/5 (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSparePart(int id)
        {
            var sparePart = await _context.SpareParts.FindAsync(id);
            if (sparePart == null)
            {
                return NotFound();
            }

            sparePart.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/SpareParts/5/history
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<object>>> GetSparePartHistory(int id)
        {
            var part = await _context.SpareParts.FindAsync(id);
            if (part == null) return NotFound();

            // 1. Invoices (Entradas)
            var purchases = await _context.PurchaseInvoiceDetails
                .Include(d => d.PurchaseInvoice)
                    .ThenInclude(i => i.Supplier)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = "ENTRADA",
                    Date = d.PurchaseInvoice.DateIssued,
                    Reference = $"Fact. {d.PurchaseInvoice.InvoiceNumber}",
                    Source = d.PurchaseInvoice.Supplier.Name,
                    Quantity = d.QuantityReceived,
                    UnitCost = d.UnitCost
                })
                .ToListAsync();

            // 2. Services (Salidas)
            var consumptions = await _context.ServiceExecutionSpareParts
                .Include(d => d.ServiceExecution)
                    .ThenInclude(e => e.ServiceRequest)
                        .ThenInclude(r => r.Vehicle)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = "SALIDA",
                    Date = d.ServiceExecution.DateCompleted ?? d.ServiceExecution.ServiceRequest.DateRequested,
                    Reference = $"ODT #{d.ServiceExecution.ServiceRequest.Id}",
                    Source = d.ServiceExecution.ServiceRequest.Vehicle.LicensePlate ?? "Vehículo Desconocido",
                    Quantity = d.Quantity,
                    UnitCost = 0m // Se podría agregar el costo promedio en el momento, por simplicidad 0.
                })
                .ToListAsync();

            // 3. Inventory Adjustments
            var adjustments = await _context.InventoryAdjustmentDetails
                .Include(d => d.InventoryAdjustment)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = d.Type.ToUpper(),
                    Date = d.InventoryAdjustment.Date,
                    Reference = $"Ajuste #{d.InventoryAdjustment.Id}",
                    Source = d.InventoryAdjustment.Remarks,
                    Quantity = d.Quantity,
                    UnitCost = d.UnitCost
                })
                .ToListAsync();

            var combinedHistory = purchases.Concat(consumptions).Concat(adjustments)
                .OrderByDescending(x => x.Date)
                .ToList();

            return Ok(combinedHistory);
        }

        private bool SparePartExists(int id)
        {
            return _context.SpareParts.Any(e => e.Id == id);
        }
    }
}
