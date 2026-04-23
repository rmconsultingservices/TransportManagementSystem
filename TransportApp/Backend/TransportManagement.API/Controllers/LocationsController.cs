using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class LocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Location>>> GetLocations([FromQuery] int? warehouseId)
        {
            var query = _context.Locations.Include(l => l.Warehouse).Where(l => l.IsActive);
            
            if (warehouseId.HasValue)
            {
                query = query.Where(l => l.WarehouseId == warehouseId.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Location>> GetLocation(int id)
        {
            var location = await _context.Locations.Include(l => l.Warehouse).FirstOrDefaultAsync(l => l.Id == id);

            if (location == null || !location.IsActive)
            {
                return NotFound();
            }

            return location;
        }

        [HttpPost]
        public async Task<ActionResult<Location>> PostLocation(Location location)
        {
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLocation), new { id = location.Id }, location);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutLocation(int id, Location location)
        {
            if (id != location.Id)
            {
                return BadRequest();
            }

            // Preserve the original CompanyId to prevent it from being reset to 0
            // when the client payload does not include it.
            var originalCompanyId = await _context.Locations
                .Where(l => l.Id == id)
                .Select(l => l.CompanyId)
                .FirstOrDefaultAsync();

            if (originalCompanyId == 0)
                return NotFound();

            location.CompanyId = originalCompanyId;
            _context.Entry(location).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LocationExists(id))
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
            {
                return NotFound();
            }

            // Soft delete
            location.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LocationExists(int id)
        {
            return _context.Locations.Any(e => e.Id == id);
        }
    }
}
