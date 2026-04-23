using System;

namespace TransportManagement.API.Models
{
    public class Warehouse : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
