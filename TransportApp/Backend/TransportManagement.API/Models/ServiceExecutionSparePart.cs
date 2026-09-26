using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class ServiceExecutionSparePart : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int ServiceExecutionId { get; set; }
        [JsonIgnore]
        public ServiceExecution? ServiceExecution { get; set; }

        public int? SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; } = 0;
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }

        // 'C' para repuesto/material de almacén, 'S' para servicio o trabajo externo
        public string ItemType { get; set; } = "C";
        public string? Description { get; set; }

        public int? PurchaseInvoiceDetailId { get; set; }
        public PurchaseInvoiceDetail? PurchaseInvoiceDetail { get; set; }
    }
}
