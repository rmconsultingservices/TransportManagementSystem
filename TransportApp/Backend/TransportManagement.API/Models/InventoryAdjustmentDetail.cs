using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class InventoryAdjustmentDetail
    {
        public int Id { get; set; }

        public int InventoryAdjustmentId { get; set; }
        
        [JsonIgnore]
        public InventoryAdjustment? InventoryAdjustment { get; set; }

        public int SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = "ENTRADA"; // ENTRADA / SALIDA

        public int Quantity { get; set; }

        public decimal UnitCost { get; set; }

        public decimal TotalCost { get; set; }
    }
}
