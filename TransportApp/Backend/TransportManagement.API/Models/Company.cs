using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Rif { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        
        public string? LogoUrl { get; set; }

        [JsonIgnore]
        public ICollection<UserCompany>? UserCompanies { get; set; }
    }
}
