using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class Supplier : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? TaxId { get; set; } // J-123456789
        public string? Code { get; set; }
        public string? Address { get; set; }
        public string? ContactName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}
