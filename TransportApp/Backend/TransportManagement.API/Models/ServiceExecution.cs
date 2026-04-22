using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TransportManagement.API.Models
{
    public class ServiceExecution : IMustHaveCompany
    {
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public int Id { get; set; }
        
        public int ServiceRequestId { get; set; }
        public ServiceRequest? ServiceRequest { get; set; }

        public string? DiagnosisObservations { get; set; }
        public string? FinalObservations { get; set; }
        
        public double? MileageAtService { get; set; }

        public DateTime? DateCompleted { get; set; }

        public ICollection<ServiceExecutionSparePart> UsedSpareParts { get; set; } = new List<ServiceExecutionSparePart>();
    }
}
