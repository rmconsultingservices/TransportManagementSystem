using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class TrailersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrailersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Trailer>>> GetTrailers()
        {
            return await _context.Trailers.Where(t => t.IsActive).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Trailer>> GetTrailer(int id)
        {
            var trailer = await _context.Trailers.FirstOrDefaultAsync(t => t.Id == id);

            if (trailer == null || !trailer.IsActive)
            {
                return NotFound();
            }

            return trailer;
        }

        [HttpPost]
        public async Task<ActionResult<Trailer>> PostTrailer(Trailer trailer)
        {
            _context.Trailers.Add(trailer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrailer), new { id = trailer.Id }, trailer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTrailer(int id, Trailer trailer)
        {
            if (id != trailer.Id)
            {
                return BadRequest();
            }

            _context.Entry(trailer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TrailerExists(id))
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
        public async Task<IActionResult> DeleteTrailer(int id)
        {
            var trailer = await _context.Trailers.FindAsync(id);
            if (trailer == null)
            {
                return NotFound();
            }

            trailer.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("sync-orphaned")]
        public async Task<IActionResult> SyncOrphanedTrailers()
        {
            var companyId = _context.CurrentCompanyId;
            if (companyId == 0) return BadRequest("No se detectó una empresa válida en la sesión.");

            var orphans = await _context.Trailers
                .IgnoreQueryFilters()
                .Where(t => t.CompanyId == 0)
                .ToListAsync();

            foreach (var trailer in orphans)
            {
                trailer.CompanyId = companyId;
            }

            await _context.SaveChangesAsync();
            return Ok(new { count = orphans.Count });
        }

        private bool TrailerExists(int id)
        {
            return _context.Trailers.Any(e => e.Id == id);
        }
    }
}
