using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class SparePartCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SparePartCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SparePartCategory>>> GetCategories()
        {
            return await _context.SparePartCategories.Where(c => c.IsActive).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SparePartCategory>> GetCategory(int id)
        {
            var category = await _context.SparePartCategories.FindAsync(id);
            if (category == null || !category.IsActive) return NotFound();
            return category;
        }

        [HttpPost]
        public async Task<ActionResult<SparePartCategory>> PostCategory(SparePartCategory category)
        {
            _context.SparePartCategories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetCategory", new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(int id, SparePartCategory category)
        {
            if (id != category.Id) return BadRequest();
            _context.Entry(category).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.SparePartCategories.FindAsync(id);
            if (category == null) return NotFound();
            
            category.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool CategoryExists(int id) => _context.SparePartCategories.Any(e => e.Id == id);
    }
}
