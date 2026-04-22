using System;
using System.Collections.Generic;

namespace TransportManagement.API.Models
{
    public class InventoryAdjustment : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;

        public ICollection<InventoryAdjustmentDetail> Details { get; set; } = new List<InventoryAdjustmentDetail>();
    }
}
