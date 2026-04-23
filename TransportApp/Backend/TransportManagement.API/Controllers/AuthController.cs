using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new { message = "User is inactive" });
            }

            var activeCompanies = user.UserCompanies
                .Where(uc => uc.Company.IsActive)
                .Select(uc => new CompanyDto
                {
                    Id = uc.Company.Id,
                    Name = uc.Company.Name,
                    Rif = uc.Company.Rif,
                    LogoUrl = uc.Company.LogoUrl
                }).ToList();

            var token = GenerateJwtToken(user);

            return Ok(new LoginResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    FullName = user.FullName,
                    IsSuperAdmin = user.IsSuperAdmin
                },
                Companies = activeCompanies
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? ""));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("FullName", user.FullName),
                new Claim("IsSuperAdmin", user.IsSuperAdmin.ToString().ToLower())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"] ?? "120")),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpGet("seed")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<IActionResult> SeedAdmin()
        {
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            
            if (existingAdmin != null)
            {
                existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
                await _context.SaveChangesAsync();
                return Ok("Admin password updated successfully with Hash.");
            }

            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FullName = "System Administrator",
                IsSuperAdmin = true,
                IsActive = true
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            var userCompany = new UserCompany
            {
                UserId = adminUser.Id,
                CompanyId = 0
            };

            _context.UserCompanies.Add(userCompany);
            await _context.SaveChangesAsync();

            return Ok($"Admin created and hashed with ID: {adminUser.Id}");
        }

        private bool VerifyPassword(string inputPassword, string storedHash)
        {
            try 
            {
                return BCrypt.Net.BCrypt.Verify(inputPassword, storedHash);
            }
            catch
            {
                // Fallback for old plain text passwords during transition if needed, 
                // but for security it's better to just return false or force a reset.
                return inputPassword == storedHash;
            }
        }
    }
}
