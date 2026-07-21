using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class PurchaseInvoiceDetail : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        public int PurchaseInvoiceId { get; set; }
        
        [JsonIgnore]
        public PurchaseInvoice? PurchaseInvoice { get; set; }

        public int SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        public string? WarehouseCode { get; set; } // e.g. "001"

        [Column(TypeName = "decimal(18,4)")]
        public decimal QuantityReceived { get; set; }

        public decimal UnitCost { get; set; }

        public decimal TaxPercentage { get; set; } // e.g. 16 for 16% IVA
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }
    }
}
