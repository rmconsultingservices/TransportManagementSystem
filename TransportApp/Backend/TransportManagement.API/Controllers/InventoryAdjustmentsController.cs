using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class InventoryAdjustmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryAdjustmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryAdjustment>>> GetInventoryAdjustments()
        {
            return await _context.InventoryAdjustments
                .Include(a => a.Details)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryAdjustment>> GetInventoryAdjustment(int id)
        {
            var adjustment = await _context.InventoryAdjustments
                .Include(a => a.Details)
                .ThenInclude(d => d.SparePart)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (adjustment == null) return NotFound();
            return adjustment;
        }

        [HttpPost]
        public async Task<ActionResult<InventoryAdjustment>> PostInventoryAdjustment([FromBody] InventoryAdjustment adjustment)
        {
            // Set User
            adjustment.CreatedBy = User.Identity?.Name ?? "System";
            if (adjustment.Date == default) adjustment.Date = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.InventoryAdjustments.Add(adjustment);
                await _context.SaveChangesAsync(); // Get Adjustment ID

                foreach (var detail in adjustment.Details)
                {
                    var part = await _context.SpareParts.FindAsync(detail.SparePartId);
                    if (part == null) continue;

                    if (detail.Type.ToUpper() == "ENTRADA")
                    {
                        part.StockQuantity += detail.Quantity;
                        part.UnitCost = detail.UnitCost; // We use the last cost as requested
                    }
                    else if (detail.Type.ToUpper() == "SALIDA")
                    {
                        part.StockQuantity -= detail.Quantity;
                        if (part.StockQuantity < 0) part.StockQuantity = 0;
                    }

                    _context.Entry(part).State = EntityState.Modified;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction("GetInventoryAdjustment", new { id = adjustment.Id }, adjustment);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventoryAdjustment(int id)
        {
            var adjustment = await _context.InventoryAdjustments
                .Include(a => a.Details)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (adjustment == null) return NotFound();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Reverse stock impacts
                foreach(var detail in adjustment.Details)
                {
                    var part = await _context.SpareParts.FindAsync(detail.SparePartId);
                    if (part != null)
                    {
                        if (detail.Type.ToUpper() == "ENTRADA") part.StockQuantity -= detail.Quantity;
                        else if (detail.Type.ToUpper() == "SALIDA") part.StockQuantity += detail.Quantity;
                        if (part.StockQuantity < 0) part.StockQuantity = 0;

                        _context.Entry(part).State = EntityState.Modified;
                    }
                }
                
                _context.InventoryAdjustments.Remove(adjustment);
                await _context.SaveChangesAsync();

                // Recalculate costs for affected parts
                var affectedPartIds = adjustment.Details.Select(d => d.SparePartId).Distinct().ToList();
                foreach(var partId in affectedPartIds)
                {
                    await RecalculateSparePartCost(partId);
                }
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT
        [HttpPut("{id}")]
        public async Task<IActionResult> PutInventoryAdjustment(int id, [FromBody] InventoryAdjustment updatedAdjustment)
        {
            if (id != updatedAdjustment.Id) return BadRequest("ID mismatch");

            var currentAdjustment = await _context.InventoryAdjustments
                .Include(a => a.Details)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (currentAdjustment == null) return NotFound();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Reverse OLD details impacts
                foreach (var oldDetail in currentAdjustment.Details)
                {
                    var part = await _context.SpareParts.FindAsync(oldDetail.SparePartId);
                    if (part != null)
                    {
                        if (oldDetail.Type.ToUpper() == "ENTRADA") part.StockQuantity -= oldDetail.Quantity;
                        else if (oldDetail.Type.ToUpper() == "SALIDA") part.StockQuantity += oldDetail.Quantity;
                        _context.Entry(part).State = EntityState.Modified;
                    }
                }

                // 2. Remove Old Details
                _context.InventoryAdjustmentDetails.RemoveRange(currentAdjustment.Details);
                await _context.SaveChangesAsync();

                // 3. Update Parent Info
                currentAdjustment.Date = updatedAdjustment.Date;
                currentAdjustment.Remarks = updatedAdjustment.Remarks;
                currentAdjustment.CreatedBy = User.Identity?.Name ?? "System";

                // 4. Apply NEW details impacts
                foreach (var newDetail in updatedAdjustment.Details)
                {
                    newDetail.Id = 0; // Ensure it's treated as new
                    currentAdjustment.Details.Add(newDetail);

                    var part = await _context.SpareParts.FindAsync(newDetail.SparePartId);
                    if (part != null)
                    {
                        if (newDetail.Type.ToUpper() == "ENTRADA") part.StockQuantity += newDetail.Quantity;
                        else if (newDetail.Type.ToUpper() == "SALIDA") part.StockQuantity -= newDetail.Quantity;

                        if (part.StockQuantity < 0) part.StockQuantity = 0;
                        _context.Entry(part).State = EntityState.Modified;
                    }
                }

                await _context.SaveChangesAsync();

                // 5. Recalculate Units Costs
                var oldPartIds = currentAdjustment.Details.Select(d => d.SparePartId).ToList();
                var newPartIds = updatedAdjustment.Details.Select(d => d.SparePartId).ToList();
                var allAffectedParts = oldPartIds.Concat(newPartIds).Distinct().ToList();

                foreach (var partId in allAffectedParts)
                {
                    await RecalculateSparePartCost(partId);
                }
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private async Task RecalculateSparePartCost(int sparePartId)
        {
            var part = await _context.SpareParts.FindAsync(sparePartId);
            if (part == null) return;

            // Find last purchase invoice
            var lastPurchase = await _context.PurchaseInvoiceDetails
                .Include(d => d.PurchaseInvoice)
                .Where(d => d.SparePartId == sparePartId)
                .OrderByDescending(d => d.PurchaseInvoice.DateIssued)
                .Select(d => new { Date = d.PurchaseInvoice.DateIssued, Cost = d.UnitCost })
                .FirstOrDefaultAsync();

            // Find last input adjustment
            var lastAdjustment = await _context.InventoryAdjustmentDetails
                .Include(d => d.InventoryAdjustment)
                .Where(d => d.SparePartId == sparePartId && d.Type.ToUpper() == "ENTRADA")
                .OrderByDescending(d => d.InventoryAdjustment.Date)
                .Select(d => new { Date = d.InventoryAdjustment.Date, Cost = d.UnitCost })
                .FirstOrDefaultAsync();

            decimal newCost = 0;
            if (lastPurchase != null && lastAdjustment != null)
            {
                newCost = lastPurchase.Date >= lastAdjustment.Date ? lastPurchase.Cost : lastAdjustment.Cost;
            }
            else if (lastPurchase != null) newCost = lastPurchase.Cost;
            else if (lastAdjustment != null) newCost = lastAdjustment.Cost;

            part.UnitCost = newCost;
            _context.Entry(part).State = EntityState.Modified;
        }
    }
}
