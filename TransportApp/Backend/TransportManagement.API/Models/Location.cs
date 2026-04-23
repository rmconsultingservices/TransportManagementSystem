using System;

namespace TransportManagement.API.Models
{
    public class Location : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // e.g., Rack A, Estante 1
        public string? Description { get; set; }
        
        public int WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
