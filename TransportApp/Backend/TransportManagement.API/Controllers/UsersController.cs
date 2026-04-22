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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
                .Select(u => new 
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.IsSuperAdmin,
                    u.IsActive,
                    Companies = u.UserCompanies != null ? u.UserCompanies.Select(uc => new { uc.CompanyId, Name = uc.Company != null ? uc.Company.Name : "" }) : null
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest();
            _context.Entry(user).State = EntityState.Modified;
            
            // Note: In an ideal scenario, password updates would be handled separately.
            // For simplicity, we just mark state as modified.
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{userId}/assign-company/{companyId}")]
        public async Task<IActionResult> AssignCompany(int userId, int companyId)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == userId)) return NotFound("User not found");
            if (!await _context.Companies.AnyAsync(c => c.Id == companyId)) return NotFound("Company not found");

            var exists = await _context.UserCompanies.AnyAsync(uc => uc.UserId == userId && uc.CompanyId == companyId);
            if (exists) return BadRequest("User is already assigned to this company");

            _context.UserCompanies.Add(new UserCompany { UserId = userId, CompanyId = companyId });
            await _context.SaveChangesAsync();
            return Ok();
        }
        
        [HttpDelete("{userId}/remove-company/{companyId}")]
        public async Task<IActionResult> RemoveCompany(int userId, int companyId)
        {
            var uc = await _context.UserCompanies.FirstOrDefaultAsync(u => u.UserId == userId && u.CompanyId == companyId);
            if (uc == null) return NotFound("Assignment not found");

            _context.UserCompanies.Remove(uc);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
