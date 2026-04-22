using System.Text.Json.Serialization;

namespace TransportManagement.API.Models
{
    public class PurchaseOrderDetail : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        public int PurchaseOrderId { get; set; }
        
        [JsonIgnore]
        public PurchaseOrder? PurchaseOrder { get; set; }

        public int PurchaseRequisitionId { get; set; }
        public PurchaseRequisition? PurchaseRequisition { get; set; }

        public int QuantityOrdered { get; set; }

        public decimal UnitPrice { get; set; }
    }
}
