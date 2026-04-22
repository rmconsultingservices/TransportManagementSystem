using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class SparePartCategory : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(255)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
