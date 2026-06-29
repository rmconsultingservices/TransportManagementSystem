using System;
using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class FleetOwner : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
    }
}
