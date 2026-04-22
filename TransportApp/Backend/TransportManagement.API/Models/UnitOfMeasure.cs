using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class UnitOfMeasure : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Abbreviation { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
