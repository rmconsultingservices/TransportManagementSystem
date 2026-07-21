using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class PhysicalInventoryDetail
    {
        public int Id { get; set; }

        public int PhysicalInventoryId { get; set; }
        
        [JsonIgnore]
        public PhysicalInventory? PhysicalInventory { get; set; }

        public int SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal TheoreticalStock { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal RealStock { get; set; }

        public decimal UnitCost { get; set; }
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }
    }
}
