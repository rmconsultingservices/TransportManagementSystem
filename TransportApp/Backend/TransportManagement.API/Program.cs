using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUnitsOfMeasureService, UnitsOfMeasureService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowCloudflare", policy =>
    {
        policy.WithOrigins("https://transportmanagementsystem.pages.dev") // Sin el "/" al final
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Necesario si usas cookies o auth específica
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

// 1. Siempre primero
app.UseCors("AllowCloudflare");

// 2. Después la redirección (o coméntala si sigues con problemas)
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
    app.MapOpenApi(); // Habilitar OpenAPI también en producción
}

// 3. Luego la autenticación y autorización
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
