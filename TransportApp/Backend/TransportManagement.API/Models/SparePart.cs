using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportManagement.API.Models
{
    public class SparePart : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ItemType { get; set; } = "Producto";
        
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }

        public int? CategoryId { get; set; }
        public SparePartCategory? Category { get; set; }
        public double? EstimatedLifeSpanKm { get; set; }
        public int? EstimatedLifeSpanMonths { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal StockQuantity { get; set; } = 0;
        
        public decimal UnitCost { get; set; } = 0;
        public string? ImageUrl { get; set; }
        
        public int? WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }

        public int? LocationId { get; set; }
        public Location? Location { get; set; }
        
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public ICollection<SparePartUnit> SparePartUnits { get; set; } = new List<SparePartUnit>();
    }
}
