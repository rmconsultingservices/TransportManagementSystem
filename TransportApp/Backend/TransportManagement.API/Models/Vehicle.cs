using System;

namespace TransportManagement.API.Models
{
    public class Vehicle : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public double CurrentMileage { get; set; }
        public double LastMaintenanceMileage { get; set; }
        public double MaintenanceInterval { get; set; } = 10000; // Default 10k km
        public bool IsActive { get; set; } = true;
    }
}
