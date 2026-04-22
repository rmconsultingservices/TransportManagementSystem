using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool IsSuperAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public ICollection<UserCompany>? UserCompanies { get; set; }
    }
}
