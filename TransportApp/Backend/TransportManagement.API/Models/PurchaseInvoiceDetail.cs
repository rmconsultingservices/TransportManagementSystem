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

        public int? SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        public string? WarehouseCode { get; set; } // e.g. "001"

        [Column(TypeName = "decimal(18,4)")]
        public decimal QuantityReceived { get; set; }

        public decimal UnitCost { get; set; }

        public decimal TaxPercentage { get; set; } // e.g. 16 for 16% IVA
        public int? UnitOfMeasureId { get; set; }
        public UnitOfMeasure? UnitOfMeasure { get; set; }

        // Vínculos con Requisición, Orden de Compra, Vehículo y Empresa
        public int? PurchaseOrderDetailId { get; set; }
        public PurchaseOrderDetail? PurchaseOrderDetail { get; set; }

        public int? PurchaseRequisitionId { get; set; }
        public PurchaseRequisition? PurchaseRequisition { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? TrailerId { get; set; }
        public Trailer? Trailer { get; set; }

        // Tipo: "C" para Compra de repuesto/insumo, "S" para Servicio de taller/tercero
        public string ItemType { get; set; } = "C";
        public string? Description { get; set; }
    }
}
