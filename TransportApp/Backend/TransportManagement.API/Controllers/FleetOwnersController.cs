using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class FleetOwnersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FleetOwnersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FleetOwner>>> GetFleetOwners()
        {
            return await _context.FleetOwners.Where(o => o.IsActive).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FleetOwner>> GetFleetOwner(int id)
        {
            var owner = await _context.FleetOwners.FirstOrDefaultAsync(o => o.Id == id);
            if (owner == null) return NotFound();
            return owner;
        }

        [HttpPost]
        public async Task<ActionResult<FleetOwner>> PostFleetOwner(FleetOwner owner)
        {
            _context.FleetOwners.Add(owner);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetFleetOwner), new { id = owner.Id }, owner);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutFleetOwner(int id, FleetOwner owner)
        {
            if (id != owner.Id) return BadRequest();
            _context.Entry(owner).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.FleetOwners.Any(e => e.Id == id)) return NotFound();
                else throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFleetOwner(int id)
        {
            var owner = await _context.FleetOwners.FindAsync(id);
            if (owner == null) return NotFound();
            owner.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
