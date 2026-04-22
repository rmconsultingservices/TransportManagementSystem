using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class ServiceRequestActivity : IMustHaveCompany
    {
        public int Id { get; set; }
        
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int ServiceRequestId { get; set; }
        
        [JsonIgnore]
        public ServiceRequest? ServiceRequest { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;
    }
}
