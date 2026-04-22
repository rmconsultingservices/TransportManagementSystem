using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class Mechanic : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Speciality { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
