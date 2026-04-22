using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs([FromQuery] string? table, [FromQuery] string? user, [FromQuery] int take = 100)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(table))
            {
                query = query.Where(a => a.TableName.Contains(table));
            }

            if (!string.IsNullOrEmpty(user))
            {
                query = query.Where(a => a.SystemUsername.Contains(user) || a.WindowsUsername.Contains(user));
            }

            return await query.OrderByDescending(a => a.Timestamp).Take(take).ToListAsync();
        }
    }
}
