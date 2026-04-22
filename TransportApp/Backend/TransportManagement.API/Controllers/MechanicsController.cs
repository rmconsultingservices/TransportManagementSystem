using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class MechanicsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MechanicsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Mechanics
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Mechanic>>> GetMechanics()
        {
            return await _context.Mechanics.ToListAsync();
        }

        // POST: api/Mechanics
        [HttpPost]
        public async Task<ActionResult<Mechanic>> PostMechanic(Mechanic mechanic)
        {
            _context.Mechanics.Add(mechanic);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetMechanic", new { id = mechanic.Id }, mechanic);
        }

        // GET: api/Mechanics/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Mechanic>> GetMechanic(int id)
        {
            var mechanic = await _context.Mechanics.FindAsync(id);
            if (mechanic == null) return NotFound();
            return mechanic;
        }
    }
}
