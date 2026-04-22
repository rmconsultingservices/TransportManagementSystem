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
    public class DriversController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DriversController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers()
        {
            return await _context.Drivers.ToListAsync();
        }

        // POST: api/Drivers
        [HttpPost]
        public async Task<ActionResult<Driver>> PostDriver(Driver driver)
        {
            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetDriver", new { id = driver.Id }, driver);
        }

        // GET: api/Drivers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null) return NotFound();
            return driver;
        }
    }
}
