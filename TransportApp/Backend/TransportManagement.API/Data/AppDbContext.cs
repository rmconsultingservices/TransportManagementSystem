using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Models;
using TransportManagement.API.Services;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;

namespace TransportManagement.API.Data
{
    public class AppDbContext : DbContext
    {
        private readonly ICurrentUserService _currentUserService;

        public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService currentUserService) : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<Company> Companies => Set<Company>();
        public DbSet<User> Users => Set<User>();
        public DbSet<UserCompany> UserCompanies => Set<UserCompany>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        public DbSet<Vehicle> Vehicles => Set<Vehicle>();
        public DbSet<Trailer> Trailers => Set<Trailer>();
        public DbSet<Driver> Drivers => Set<Driver>();
        public DbSet<Mechanic> Mechanics => Set<Mechanic>();
        public DbSet<SparePart> SpareParts => Set<SparePart>();
        public DbSet<SparePartCategory> SparePartCategories => Set<SparePartCategory>();
        public DbSet<UnitOfMeasure> UnitsOfMeasure => Set<UnitOfMeasure>();
        public DbSet<Warehouse> Warehouses => Set<Warehouse>();
        public DbSet<Location> Locations => Set<Location>();
        public DbSet<InventoryAdjustment> InventoryAdjustments => Set<InventoryAdjustment>();
        public DbSet<InventoryAdjustmentDetail> InventoryAdjustmentDetails => Set<InventoryAdjustmentDetail>();
        public DbSet<MaintenanceOrder> MaintenanceOrders => Set<MaintenanceOrder>();

        // Service & Workshop Flow
        public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
        public DbSet<ServiceRequestActivity> ServiceRequestActivities => Set<ServiceRequestActivity>();
        public DbSet<ServiceExecution> ServiceExecutions => Set<ServiceExecution>();
        public DbSet<ServiceExecutionSparePart> ServiceExecutionSpareParts => Set<ServiceExecutionSparePart>();
        public DbSet<ServiceLog> ServiceLogs => Set<ServiceLog>();
        public DbSet<PurchaseRequisition> PurchaseRequisitions => Set<PurchaseRequisition>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<Quotation> Quotations => Set<Quotation>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
        public DbSet<PurchaseOrderDetail> PurchaseOrderDetails => Set<PurchaseOrderDetail>();
        public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
        public DbSet<PurchaseInvoiceDetail> PurchaseInvoiceDetails => Set<PurchaseInvoiceDetail>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Composite key for UserCompany
            modelBuilder.Entity<UserCompany>()
                .HasKey(uc => new { uc.UserId, uc.CompanyId });

            // Apply Global Query Filter for Multi-Tenant Isolation
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                // Disable cascading delete for CompanyId foreign keys to prevent cyclic paths
                foreach (var fk in entityType.GetForeignKeys())
                {
                    if (fk.Properties.Any(p => p.Name == "CompanyId"))
                    {
                        fk.DeleteBehavior = DeleteBehavior.Restrict;
                    }
                }

                if (typeof(IMustHaveCompany).IsAssignableFrom(entityType.ClrType))
                {
                    var parameter = Expression.Parameter(entityType.ClrType, "e");
                    var companyIdProperty = Expression.Property(parameter, "CompanyId");
                    
                    // The correct way to refer to 'this.CurrentCompanyId' in a way that EF Core 
                    // understands it should use the property from the CURRENT context instance.
                    var currentCompanyIdProperty = Expression.Property(Expression.Constant(this), nameof(CurrentCompanyId));
                    var filterExpression = Expression.Equal(companyIdProperty, currentCompanyIdProperty);

                    var lambda = Expression.Lambda(filterExpression, parameter);
                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                }
            }
        }

        // Helper property for the expression tree to read the scoped service value dynamically during queries
        public int CurrentCompanyId => _currentUserService.CompanyId ?? 0;

        public override int SaveChanges()
        {
            ApplyConcepts();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyConcepts();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyConcepts()
        {
            var entries = ChangeTracker.Entries().ToList();
            var timestamp = DateTime.UtcNow;
            
            int activeCompanyId = _currentUserService.CompanyId ?? 0;
            string systemUser = _currentUserService.SystemUsername;
            string clientIp = _currentUserService.ClientIp;
            string userAgent = _currentUserService.UserAgent;

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                // 1. Inject CompanyId for new entities that require it
                if (entry.State == EntityState.Added && entry.Entity is IMustHaveCompany mustHaveCompany)
                {
                    if (mustHaveCompany.CompanyId == 0)
                    {
                        mustHaveCompany.CompanyId = activeCompanyId;
                    }
                }

                // 2. Audit Trail (Ignore AuditLog itself to prevent infinite loop of auditing)
                if (entry.Entity is AuditLog)
                    continue;

                var auditLog = new AuditLog
                {
                    TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                    Action = entry.State.ToString(),
                    Timestamp = timestamp,
                    CompanyId = activeCompanyId,
                    SystemUsername = systemUser,
                    WindowsUsername = clientIp,      // Using IP as WindowsUser equivalent for web
                    MachineName = userAgent,         // Using UserAgent as MachineName equivalent for web
                    RecordId = GetPrimaryKey(entry)
                };

                if (entry.State == EntityState.Added)
                {
                    auditLog.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                }
                else if (entry.State == EntityState.Deleted)
                {
                    auditLog.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                }
                else if (entry.State == EntityState.Modified)
                {
                    var oldVals = entry.OriginalValues.Properties.ToDictionary(p => p.Name, p => entry.OriginalValues[p]);
                    var newVals = entry.CurrentValues.Properties.ToDictionary(p => p.Name, p => entry.CurrentValues[p]);
                    auditLog.OldValues = JsonSerializer.Serialize(oldVals);
                    auditLog.NewValues = JsonSerializer.Serialize(newVals);
                }

                AuditLogs.Add(auditLog);
            }
        }

        private string GetPrimaryKey(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            var keyNames = entry.Metadata.FindPrimaryKey()?.Properties.Select(x => x.Name).ToList();
            if (keyNames != null && keyNames.Count > 0)
            {
                var values = keyNames.Select(k => entry.CurrentValues[k]?.ToString() ?? "0");
                return string.Join("|", values);
            }
            return "0";
        }
    }
}
