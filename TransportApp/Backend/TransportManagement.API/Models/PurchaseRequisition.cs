using System;
using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class PurchaseRequisition : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int ServiceRequestId { get; set; }
        
        [JsonIgnore]
        public ServiceRequest? ServiceRequest { get; set; }

        public DateTime DateRequested { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string PartNameOrDescription { get; set; } = string.Empty;
        
        public int Quantity { get; set; } = 1;

        // Pendiente, Cotizando, Aprobada, Rechazada, Comprada
        public string Status { get; set; } = "Pendiente";

        public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();
    }
}
