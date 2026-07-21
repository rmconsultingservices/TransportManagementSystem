using System.ComponentModel.DataAnnotations.Schema;
using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class Quotation : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int PurchaseRequisitionId { get; set; }
        [JsonIgnore]
        public PurchaseRequisition? PurchaseRequisition { get; set; }

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal Quantity { get; set; } = 1;

        public DateTime DateReceived { get; set; } = DateTime.UtcNow;

        public string? Notes { get; set; }

        public bool IsSelected { get; set; } = false;
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }
    }
}
