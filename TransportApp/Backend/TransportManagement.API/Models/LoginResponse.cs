using System.Collections.Generic;

namespace TransportManagement.API.Models
{
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
        public List<CompanyDto> Companies { get; set; } = new List<CompanyDto>();
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool IsSuperAdmin { get; set; }
    }

    public class CompanyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Rif { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
    }
}
