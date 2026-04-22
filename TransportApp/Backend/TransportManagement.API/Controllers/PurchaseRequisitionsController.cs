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
    public class PurchaseRequisitionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseRequisitionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseRequisitions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseRequisition>>> GetRequisitions()
        {
            return await _context.PurchaseRequisitions
                .Include(r => r.ServiceRequest)
                    .ThenInclude(sr => sr.Vehicle)
                .Include(r => r.Quotations)
                    .ThenInclude(q => q.Supplier)
                .OrderByDescending(r => r.DateRequested)
                .ToListAsync();
        }

        // POST: api/PurchaseRequisitions/5/Quotes
        [HttpPost("{id}/Quotes")]
        public async Task<ActionResult<Quotation>> AddQuotation(int id, [FromBody] Quotation quote)
        {
            var req = await _context.PurchaseRequisitions.FindAsync(id);
            if (req == null) return NotFound();

            quote.PurchaseRequisitionId = id;
            quote.DateReceived = System.DateTime.UtcNow;
            
            _context.Quotations.Add(quote);
            
            if (req.Status == "Pendiente") req.Status = "Cotizando";
            
            await _context.SaveChangesAsync();

            return Ok(quote);
        }

        // PUT: api/PurchaseRequisitions/5/SelectQuote/2
        [HttpPut("{id}/SelectQuote/{quoteId}")]
        public async Task<IActionResult> SelectQuote(int id, int quoteId)
        {
            var req = await _context.PurchaseRequisitions
                .Include(r => r.Quotations)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (req == null) return NotFound();

            foreach (var q in req.Quotations)
            {
                q.IsSelected = (q.Id == quoteId);
            }

            req.Status = "Comprada";
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
