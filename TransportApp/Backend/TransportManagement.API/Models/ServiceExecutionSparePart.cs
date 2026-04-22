using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class ServiceExecutionSparePart : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int ServiceExecutionId { get; set; }
        public ServiceExecution? ServiceExecution { get; set; }

        public int SparePartId { get; set; }
        public SparePart? SparePart { get; set; }

        public int Quantity { get; set; }
    }
}
