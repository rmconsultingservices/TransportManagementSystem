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

        public int TheoreticalStock { get; set; }

        public int RealStock { get; set; }

        public decimal UnitCost { get; set; }
    }
}
