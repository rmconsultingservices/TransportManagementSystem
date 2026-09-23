using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportManagement.API.Models
{
    public class PurchaseInvoice : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        public int? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        [Required]
        public string InvoiceNumber { get; set; } = string.Empty;

        public string? ControlNumber { get; set; }

        public DateTime DateIssued { get; set; } = DateTime.UtcNow;

        public string PaymentCondition { get; set; } = "001"; // e.g., 001 for Contado

        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Pagos y CXP (Cuentas por Pagar)
        public string PaymentStatus { get; set; } = "CXP"; // "CXP", "PARCIAL", "PAGADO"
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; } = 0;
        
        public DateTime? PaymentDate { get; set; }
        public string? PaymentMethod { get; set; } // Transferencia, Efectivo, Pago Móvil, Cheque
        public string? PaymentReference { get; set; } // Nº de Referencia bancaria o recibo
        
        [Column(TypeName = "decimal(18,4)")]
        public decimal ExchangeRate { get; set; } = 0; // Tasa oficial para conversión en Bs

        public string? AttachmentUrl { get; set; }
        public bool IsCancelled { get; set; } = false;

        public ICollection<PurchaseInvoiceDetail> Details { get; set; } = new List<PurchaseInvoiceDetail>();
    }
}
