using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(x => x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUnitsOfMeasureService, UnitsOfMeasureService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    options.AddPolicy("AllowCloudflare", policy =>
    {
        policy.WithOrigins("https://transportmanagementsystem.pages.dev") // Sin el "/" al final
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Necesario si usas cookies o auth especÃ­fica
    });
});
builder.Services.AddOpenApi();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? "")),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Register the Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Auto-heal database schema for missing columns (TrailerId and ServiceRequestId in MaintenanceOrders)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        // Aplicar migraciones de EF Core automÃ¡ticamente en el arranque
        try { context.Database.Migrate(); } catch (Exception mEx) { Console.WriteLine("Migrate note: " + mEx.Message); }
        
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MaintenanceOrders') AND name = 'TrailerId')
            ALTER TABLE MaintenanceOrders ADD TrailerId INT NULL;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MaintenanceOrders') AND name = 'ServiceRequestId')
            ALTER TABLE MaintenanceOrders ADD ServiceRequestId INT NULL;
        ");
        // Dynamic column migrations
            context.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'PurchaseOrderId')
                ALTER TABLE PurchaseInvoices ADD PurchaseOrderId INT NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'PaymentStatus')
                ALTER TABLE PurchaseInvoices ADD PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'CXP';

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'AmountPaid')
                ALTER TABLE PurchaseInvoices ADD AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'PaymentDate')
                ALTER TABLE PurchaseInvoices ADD PaymentDate DATETIME2 NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'PaymentMethod')
                ALTER TABLE PurchaseInvoices ADD PaymentMethod NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'PaymentReference')
                ALTER TABLE PurchaseInvoices ADD PaymentReference NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoices') AND name = 'ExchangeRate')
                ALTER TABLE PurchaseInvoices ADD ExchangeRate DECIMAL(18,4) NOT NULL DEFAULT 0;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'PurchaseOrderDetailId')
                ALTER TABLE PurchaseInvoiceDetails ADD PurchaseOrderDetailId INT NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'PurchaseRequisitionId')
                ALTER TABLE PurchaseInvoiceDetails ADD PurchaseRequisitionId INT NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'VehicleId')
                ALTER TABLE PurchaseInvoiceDetails ADD VehicleId INT NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'TrailerId')
                ALTER TABLE PurchaseInvoiceDetails ADD TrailerId INT NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'ItemType')
                ALTER TABLE PurchaseInvoiceDetails ADD ItemType NVARCHAR(10) NOT NULL DEFAULT 'C';

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PurchaseInvoiceDetails') AND name = 'Description')
                ALTER TABLE PurchaseInvoiceDetails ADD Description NVARCHAR(500) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ServiceExecutionSpareParts') AND name = 'ItemType')
                ALTER TABLE ServiceExecutionSpareParts ADD ItemType NVARCHAR(10) NOT NULL DEFAULT 'C';

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ServiceExecutionSpareParts') AND name = 'Description')
                ALTER TABLE ServiceExecutionSpareParts ADD Description NVARCHAR(500) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ServiceExecutionSpareParts') AND name = 'PurchaseInvoiceDetailId')
                ALTER TABLE ServiceExecutionSpareParts ADD PurchaseInvoiceDetailId INT NULL;

                BEGIN TRY
                    ALTER TABLE ServiceExecutionSpareParts ALTER COLUMN SparePartId INT NULL;
                END TRY
                BEGIN CATCH
                END CATCH

                BEGIN TRY
                    ALTER TABLE PurchaseInvoiceDetails ALTER COLUMN SparePartId INT NULL;
                END TRY
                BEGIN CATCH
                END CATCH
            ");

        Console.WriteLine("Base de datos verificada y actualizada correctamente.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al verificar la base de datos: {ex.Message}");
    }
}

// Ensure uploads directory exists
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "invoices");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles();

// 1. Siempre primero
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevPolicy");
}
else
{
    app.UseCors("AllowCloudflare");
}

// 2. DespuÃ©s la redirecciÃ³n (o comÃ©ntala si sigues con problemas)
// app.UseHttpsRedirection();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else 
{
    app.MapOpenApi(); // Habilitar OpenAPI tambiÃ©n en producciÃ³n
}

// 3. Luego la autenticaciÃ³n y autorizaciÃ³n
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

