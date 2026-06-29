using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class PhysicalInventory : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Number { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }

        public int? LocationId { get; set; }
        public Location? Location { get; set; }

        public DateTime DateStarted { get; set; } = DateTime.UtcNow;
        public DateTime? DateProcessed { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "INITIATED"; // INITIATED, PROCESSED, CANCELLED

        public ICollection<PhysicalInventoryDetail> Details { get; set; } = new List<PhysicalInventoryDetail>();
    }
}
