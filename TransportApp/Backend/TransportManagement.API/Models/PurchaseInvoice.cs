using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class PurchaseInvoice : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        [Required]
        public string InvoiceNumber { get; set; } = string.Empty;

        public string? ControlNumber { get; set; }

        public DateTime DateIssued { get; set; } = DateTime.UtcNow;

        public string PaymentCondition { get; set; } = "001"; // e.g., 001 for Contado

        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public ICollection<PurchaseInvoiceDetail> Details { get; set; } = new List<PurchaseInvoiceDetail>();
    }
}
