using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            }
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest();

            var existingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null) return NotFound();

            if (!string.IsNullOrEmpty(user.PasswordHash) && user.PasswordHash != existingUser.PasswordHash)
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            }

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado" });

            // Prevent self-deactivation if preferred
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != null && int.TryParse(currentUserId, out int parsedId) && parsedId == id && user.IsActive)
            {
                // Warn or allow? Better to allow or block self-lockout
            }

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = user.Id, isActive = user.IsActive, message = user.IsActive ? "Usuario activado exitosamente." : "Usuario inhabilitado exitosamente." });
        }

                [HttpDelete("{id}")]
        [HttpPost("{id}/delete")]
        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.UserCompanies)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null) return NotFound(new { message = "Usuario no encontrado" });

                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != null && int.TryParse(currentUserId, out int parsedId) && parsedId == id)
                {
                    return BadRequest(new { message = "No puedes eliminar tu propio usuario de sesion activa." });
                }

                if (user.UserCompanies != null && user.UserCompanies.Any())
                {
                    _context.UserCompanies.RemoveRange(user.UserCompanies);
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Usuario eliminado exitosamente." });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "No se puede eliminar el usuario porque tiene registros historicos vinculados en la base de datos. Se recomienda inhabilitar el usuario para bloquear su acceso sin perder la integridad de datos." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error al eliminar el usuario: {ex.Message}" });
            }
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
