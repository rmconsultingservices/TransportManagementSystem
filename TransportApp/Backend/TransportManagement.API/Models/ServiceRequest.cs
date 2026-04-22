using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class ServiceRequest : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? TrailerId { get; set; }
        public Trailer? Trailer { get; set; }

        [Required]
        public DateTime DateRequested { get; set; }

        public int? DriverId { get; set; }
        public Driver? Driver { get; set; }
        
        [Required]
        public string RepairType { get; set; } = "Preventiva";
        
        public string Description { get; set; } = string.Empty;
        
        // Pendiente, En Revisión, Esperando Repuestos, Completado
        public string Status { get; set; } = "Pendiente";

        public int? MechanicId { get; set; }
        public Mechanic? Mechanic { get; set; }

        [JsonIgnore]
        public ServiceExecution? Execution { get; set; }

        public ICollection<ServiceLog> Logs { get; set; } = new List<ServiceLog>();
        public ICollection<PurchaseRequisition> Requisitions { get; set; } = new List<PurchaseRequisition>();
        public ICollection<ServiceRequestActivity> Activities { get; set; } = new List<ServiceRequestActivity>();
    }
}
