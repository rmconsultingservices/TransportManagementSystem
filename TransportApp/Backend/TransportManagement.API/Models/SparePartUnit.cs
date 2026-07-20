using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportManagement.API.Models
{
    public class SparePartUnit : IMustHaveCompany
    {
        public int Id { get; set; }
        
        public int CompanyId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Company? Company { get; set; }

        public int SparePartId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public SparePart? SparePart { get; set; }

        public int UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }

        public bool IsPrimary { get; set; } = false;

        [Column(TypeName = "decimal(18,4)")]
        public decimal Equivalence { get; set; } = 1;

        public bool IsInverse { get; set; } = false;
    }
}

