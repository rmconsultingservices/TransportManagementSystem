using System;

namespace TransportManagement.API.Models
{
    public class MaintenanceOrder : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }
        
        public int? TrailerId { get; set; }
        public Trailer? Trailer { get; set; }

        public int? ServiceRequestId { get; set; }
        
        public DateTime Date { get; set; }
        public string Type { get; set; } = "Preventive"; // Preventive, Corrective
        public double MileageAtMaintenance { get; set; }
        public string MechanicAssigned { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
