using System;

namespace TransportManagement.API.Models
{
    public class Trailer : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // e.g., Refrigerated, Flatbed
        public int AxlesCount { get; set; }
        public double CurrentMileage { get; set; }
        public double LastMaintenanceMileage { get; set; }
        public double MaintenanceInterval { get; set; } = 15000; // Default 15k km for trailers
        public bool IsActive { get; set; } = true;
    }
}
