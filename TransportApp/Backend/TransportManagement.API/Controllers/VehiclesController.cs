using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class VehiclesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehiclesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
        {
            return await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id);

            if (vehicle == null)
            {
                // Diagnóstico: ¿Existe pero en otra empresa?
                var existsWithoutFilter = await _context.Vehicles
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (existsWithoutFilter != null)
                {
                    return NotFound(new { 
                        message = $"El vehículo #{id} existe, pero está asignado a la Empresa ID: {existsWithoutFilter.CompanyId}. Tu sesión actual es Empresa ID: {_context.CurrentCompanyId}.",
                        errorType = "CompanyMismatch",
                        targetCompanyId = existsWithoutFilter.CompanyId,
                        currentCompanyId = _context.CurrentCompanyId
                    });
                }

                return NotFound(new { message = $"El vehículo #{id} no existe en la base de datos." });
            }

            return vehicle;
        }

        [HttpPost]
        public async Task<ActionResult<Vehicle>> PostVehicle(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicle(int id, Vehicle vehicle)
        {
            if (id != vehicle.Id)
            {
                return BadRequest();
            }

            _context.Entry(vehicle).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VehicleExists(id))
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

        // Soft delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound();
            }

            vehicle.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("sync-orphaned")]
        public async Task<IActionResult> SyncOrphanedVehicles([FromQuery] int? targetCompanyId)
        {
            try 
            {
                var companyId = targetCompanyId ?? _context.CurrentCompanyId;
                
                // We must use IgnoreQueryFilters to see the orphans (CompanyId = 0)
                // If the target company is also 0, this doesn't change anything, 
                // but we should still allow it to complete successfully.
                var orphans = await _context.Vehicles
                    .IgnoreQueryFilters()
                    .Where(v => v.CompanyId == 0)
                    .ToListAsync();

                if (companyId != 0)
                {
                    foreach (var vehicle in orphans)
                    {
                        vehicle.CompanyId = companyId;
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new { count = orphans.Count });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.Id == id);
        }
    }
}
