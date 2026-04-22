using System;
using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class ServiceLog : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public int ServiceRequestId { get; set; }
        
        [JsonIgnore]
        public ServiceRequest? ServiceRequest { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string Note { get; set; } = string.Empty;
        
        public string? CreatedBy { get; set; }
    }
}
