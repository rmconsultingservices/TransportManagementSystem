using System;
using System.Collections.Generic;

namespace TransportManagement.API.Models
{
    public class PurchaseOrder : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public string OrderNumber { get; set; } = string.Empty;

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        public string? ApprovedBy { get; set; }

        public string Status { get; set; } = "Pendiente por Recibir"; // Pendiente por Recibir, Parcialmente Recibida, Completada, Anulada

        public decimal OrderTotal { get; set; }

        public ICollection<PurchaseOrderDetail> Details { get; set; } = new List<PurchaseOrderDetail>();
    }
}
