using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using TransportManagement.API.Models;
using TransportManagement.API.Services;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Uncomment when auth is required
    public class UnitsOfMeasureController : ControllerBase
    {
        private readonly IUnitsOfMeasureService _service;

        public UnitsOfMeasureController(IUnitsOfMeasureService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UnitOfMeasure>>> GetUnitsOfMeasure(bool includeInactive = false)
        {
            var items = await _service.GetAllAsync(includeInactive);
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UnitOfMeasure>> GetUnitOfMeasure(int id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<UnitOfMeasure>> PostUnitOfMeasure(UnitOfMeasure unit)
        {
            var created = await _service.CreateAsync(unit);
            return CreatedAtAction(nameof(GetUnitOfMeasure), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUnitOfMeasure(int id, UnitOfMeasure unit)
        {
            if (id != unit.Id) return BadRequest();

            await _service.UpdateAsync(id, unit);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnitOfMeasure(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
