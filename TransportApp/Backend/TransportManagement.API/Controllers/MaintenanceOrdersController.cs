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
    public class MaintenanceOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaintenanceOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/MaintenanceOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceOrder>>> GetMaintenanceOrders([FromQuery] int? vehicleId, [FromQuery] int? trailerId)
        {
            var query = _context.MaintenanceOrders.AsQueryable();

            if (vehicleId.HasValue)
                query = query.Where(m => m.VehicleId == vehicleId);
            
            if (trailerId.HasValue)
                query = query.Where(m => m.TrailerId == trailerId);

            return await query
                .Include(m => m.Vehicle)
                .Include(m => m.Trailer)
                .OrderByDescending(m => m.Date)
                .ToListAsync();
        }

        // GET: api/MaintenanceOrders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceOrder>> GetMaintenanceOrder(int id)
        {
            var maintenanceOrder = await _context.MaintenanceOrders
                .Include(m => m.Vehicle)
                .Include(m => m.Trailer)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (maintenanceOrder == null) return NotFound();
            return maintenanceOrder;
        }

        // POST: api/MaintenanceOrders
        [HttpPost]
        public async Task<ActionResult<MaintenanceOrder>> PostMaintenanceOrder(MaintenanceOrder maintenanceOrder)
        {
            if (maintenanceOrder.Date == default) maintenanceOrder.Date = System.DateTime.UtcNow;
            
            _context.MaintenanceOrders.Add(maintenanceOrder);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetMaintenanceOrder", new { id = maintenanceOrder.Id }, maintenanceOrder);
        }

        // DELETE: api/MaintenanceOrders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaintenanceOrder(int id)
        {
            var maintenanceOrder = await _context.MaintenanceOrders.FindAsync(id);
            if (maintenanceOrder == null) return NotFound();

            _context.MaintenanceOrders.Remove(maintenanceOrder);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
