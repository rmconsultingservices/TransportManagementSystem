using System;

namespace TransportManagement.API.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public string RecordId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        
        // Using string to store JSON
        public string OldValues { get; set; } = string.Empty;
        public string NewValues { get; set; } = string.Empty;
        
        public string SystemUsername { get; set; } = string.Empty;
        public string WindowsUsername { get; set; } = string.Empty;
        public string MachineName { get; set; } = string.Empty;
    }
}
