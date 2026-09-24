using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ClosedXML.Excel;
using System.IO;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [ApiController]
    public class SparePartsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SparePartsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SpareParts
        [HttpGet]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<IEnumerable<SparePart>>> GetSpareParts()
        {
            return await _context.SpareParts
                .AsNoTracking()
                .Include(s => s.Location)
                .Include(s => s.Warehouse)
                .Include(s => s.Category)
                .Include(s => s.UnitOfMeasure)
                .Include(s => s.SparePartUnits).ThenInclude(u => u.UnitOfMeasure)
                .Where(s => s.IsActive)
                .AsSplitQuery()
                .ToListAsync();
        }

        // GET: api/SpareParts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SparePart>> GetSparePart(int id)
        {
            var sparePart = await _context.SpareParts.Include(s => s.SparePartUnits).ThenInclude(u => u.UnitOfMeasure).FirstOrDefaultAsync(s => s.Id == id);

            if (sparePart == null || !sparePart.IsActive)
            {
                return NotFound();
            }

            return sparePart;
        }

        // PUT: api/SpareParts/5
        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<IActionResult> PutSparePart(int id, SparePart sparePart)
        {
            if (id != sparePart.Id)
            {
                return BadRequest();
            }

            var existingPart = await _context.SpareParts.Include(s => s.SparePartUnits).ThenInclude(u => u.UnitOfMeasure).FirstOrDefaultAsync(s => s.Id == id);
            if (existingPart == null)
            {
                return NotFound();
            }

            // Update only allowed properties, preserving CompanyId and RegistrationDate
            if (!string.IsNullOrWhiteSpace(sparePart.Code) && sparePart.Code != "TEMP" && !sparePart.Code.StartsWith("Auto-generado", StringComparison.OrdinalIgnoreCase))
            {
                existingPart.Code = sparePart.Code;
            }
            existingPart.Name = sparePart.Name;
            existingPart.ItemType = sparePart.ItemType;
            existingPart.Brand = sparePart.Brand;
            existingPart.Model = sparePart.Model;
            existingPart.Presentation = sparePart.Presentation;
            existingPart.UnitOfMeasureId = sparePart.UnitOfMeasureId;
            existingPart.CategoryId = sparePart.CategoryId;
            existingPart.EstimatedLifeSpanKm = sparePart.EstimatedLifeSpanKm;
            existingPart.EstimatedLifeSpanMonths = sparePart.EstimatedLifeSpanMonths;
            existingPart.StockQuantity = sparePart.StockQuantity;
            existingPart.UnitCost = sparePart.UnitCost;
            existingPart.WarehouseId = sparePart.WarehouseId;
                        existingPart.LocationId = sparePart.LocationId;
            existingPart.IsActive = sparePart.IsActive;

            // Update SparePartUnits
            _context.SparePartUnits.RemoveRange(existingPart.SparePartUnits);
            if (sparePart.SparePartUnits != null)
            {
                foreach (var unit in sparePart.SparePartUnits)
                {
                    unit.Id = 0; // Ensure it is treated as new
                    existingPart.SparePartUnits.Add(unit);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SparePartExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/SpareParts
        [HttpPost]
        public async Task<ActionResult<SparePart>> PostSparePart(SparePart sparePart)
        {
            if (string.IsNullOrWhiteSpace(sparePart.Code) || sparePart.Code == "TEMP" || sparePart.Code.StartsWith("Auto-generado", StringComparison.OrdinalIgnoreCase))
            {
                var existingCodes = await _context.SpareParts.IgnoreQueryFilters().Select(s => s.Code).ToListAsync();
                int nextNum = 1;
                foreach (var c in existingCodes)
                {
                    if (c != null && c.StartsWith("SSR-", StringComparison.OrdinalIgnoreCase))
                    {
                        var part = c.Substring(4);
                        if (int.TryParse(part, out int n) && n >= nextNum)
                        {
                            nextNum = n + 1;
                        }
                    }
                }
                var maxId = await _context.SpareParts.IgnoreQueryFilters().MaxAsync(s => (int?)s.Id) ?? 0;
                if (maxId >= nextNum)
                {
                    nextNum = maxId + 1;
                }
                sparePart.Code = $"SSR-{nextNum:D5}";
            }

            _context.SpareParts.Add(sparePart);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSparePart", new { id = sparePart.Id }, sparePart);
        }

        // DELETE: api/SpareParts/5 (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSparePart(int id)
        {
            var sparePart = await _context.SpareParts.Include(s => s.SparePartUnits).ThenInclude(u => u.UnitOfMeasure).FirstOrDefaultAsync(s => s.Id == id);
            if (sparePart == null)
            {
                return NotFound();
            }

            sparePart.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/SpareParts/5/history
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<object>>> GetSparePartHistory(int id)
        {
            var part = await _context.SpareParts.FindAsync(id);
            if (part == null) return NotFound();

            // 1. Invoices (Entradas)
            var purchases = await _context.PurchaseInvoiceDetails
                .Include(d => d.PurchaseInvoice)
                    .ThenInclude(i => i.Supplier)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = "ENTRADA",
                    Date = d.PurchaseInvoice.DateIssued,
                    Reference = $"Fact. {d.PurchaseInvoice.InvoiceNumber}",
                    Source = d.PurchaseInvoice.Supplier.Name,
                    Quantity = d.QuantityReceived,
                    UnitCost = d.UnitCost
                })
                .ToListAsync();

            // 2. Services (Salidas)
            var consumptions = await _context.ServiceExecutionSpareParts
                .Include(d => d.ServiceExecution)
                    .ThenInclude(e => e.ServiceRequest)
                        .ThenInclude(r => r.Vehicle)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = "SALIDA",
                    Date = d.ServiceExecution.DateCompleted ?? d.ServiceExecution.ServiceRequest.DateRequested,
                    Reference = $"ODT #{d.ServiceExecution.ServiceRequest.Id}",
                    Source = d.ServiceExecution.ServiceRequest.Vehicle.LicensePlate ?? "Vehículo Desconocido",
                    Quantity = d.Quantity,
                    UnitCost = 0m // Se podría agregar el costo promedio en el momento, por simplicidad 0.
                })
                .ToListAsync();

            // 3. Inventory Adjustments
            var adjustments = await _context.InventoryAdjustmentDetails
                .Include(d => d.InventoryAdjustment)
                .Where(d => d.SparePartId == id)
                .Select(d => new
                {
                    Type = d.Type.ToUpper(),
                    Date = d.InventoryAdjustment.Date,
                    Reference = $"Ajuste #{d.InventoryAdjustment.Id}",
                    Source = d.InventoryAdjustment.Remarks,
                    Quantity = d.Quantity,
                    UnitCost = d.UnitCost
                })
                .ToListAsync();

            var combinedHistory = purchases.Concat(consumptions).Concat(adjustments)
                .OrderByDescending(x => x.Date)
                .ToList();

            return Ok(combinedHistory);
        }

        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No se ha enviado ningún archivo.");

            var sparePart = await _context.SpareParts.Include(s => s.SparePartUnits).ThenInclude(u => u.UnitOfMeasure).FirstOrDefaultAsync(s => s.Id == id);
            if (sparePart == null) return NotFound();

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "spareparts");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"part_{id}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            sparePart.ImageUrl = $"/uploads/spareparts/{uniqueFileName}";
            await _context.SaveChangesAsync();

            return Ok(new { ImageUrl = sparePart.ImageUrl });
        }

        private bool SparePartExists(int id)
        {
            return _context.SpareParts.Any(e => e.Id == id);
        }
    
        
        [HttpGet("export-template")]
        public async Task<IActionResult> ExportTemplate()
        {
            var spareParts = await _context.SpareParts
                .Include(s => s.Category)
                .Include(s => s.UnitOfMeasure)
                .Include(s => s.Warehouse)
                .Include(s => s.Location)
                .Where(s => s.IsActive)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Catalogo_Articulos");

            worksheet.Cell(1, 1).Value = "Código";
            worksheet.Cell(1, 2).Value = "Nombre";
            worksheet.Cell(1, 3).Value = "Tipo";
            worksheet.Cell(1, 4).Value = "Marca";
            worksheet.Cell(1, 5).Value = "Modelo";
            worksheet.Cell(1, 6).Value = "Categoría";
            worksheet.Cell(1, 7).Value = "Unidad";
            worksheet.Cell(1, 8).Value = "Almacén";
            worksheet.Cell(1, 9).Value = "Ubicación";
            worksheet.Cell(1, 10).Value = "Costo Unitario";
            worksheet.Cell(1, 11).Value = "Stock";

            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < spareParts.Count; i++)
            {
                var row = i + 2;
                var part = spareParts[i];
                worksheet.Cell(row, 1).Value = part.Code;
                worksheet.Cell(row, 2).Value = part.Name;
                worksheet.Cell(row, 3).Value = string.IsNullOrEmpty(part.ItemType) ? "Producto" : part.ItemType;
                worksheet.Cell(row, 4).Value = part.Brand ?? "";
                worksheet.Cell(row, 5).Value = part.Model ?? "";
                worksheet.Cell(row, 6).Value = part.Category?.Name ?? "";
                worksheet.Cell(row, 7).Value = part.UnitOfMeasure?.Name ?? "";
                worksheet.Cell(row, 8).Value = part.Warehouse?.Name ?? "";
                worksheet.Cell(row, 9).Value = part.Location?.Name ?? "";
                worksheet.Cell(row, 10).Value = part.UnitCost;
                worksheet.Cell(row, 11).Value = part.StockQuantity;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content_bytes = stream.ToArray();

            return File(content_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Plantilla_Catalogo_Articulos.xlsx");
        }

                [HttpPost("import")]
        public async Task<IActionResult> ImportExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo no válido");
                
            var sparePartsToAdd = new List<SparePart>();
            int insertedCount = 0;
            int updatedCount = 0;
            
            // Resolve company id once
            int cid = _context.CurrentCompanyId;

            // Get maximum existing correlative number to generate sequential codes
            var existingCodes = await _context.SpareParts.Select(s => s.Code).ToListAsync();
            int nextArtNum = 1;
            int nextSrvNum = 1;

            foreach (var c in existingCodes)
            {
                if (c.StartsWith("ART-") && int.TryParse(c.Substring(4), out int n1))
                {
                    if (n1 >= nextArtNum) nextArtNum = n1 + 1;
                }
                else if (c.StartsWith("SRV-") && int.TryParse(c.Substring(4), out int n2))
                {
                    if (n2 >= nextSrvNum) nextSrvNum = n2 + 1;
                }
            }

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                using (var workbook = new XLWorkbook(stream))
                {
                    var worksheet = workbook.Worksheet(1);
                    var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

                    foreach (var row in rows)
                    {
                        var code = row.Cell(1).Value.ToString().Trim();
                        var name = row.Cell(2).Value.ToString().Trim();
                        
                        // If name is empty, skip this row
                        if (string.IsNullOrEmpty(name))
                            continue;

                        var type = row.Cell(3).Value.ToString().Trim();
                        if (string.IsNullOrEmpty(type)) type = "Producto";
                        var brand = row.Cell(4).Value.ToString().Trim();
                        var model = row.Cell(5).Value.ToString().Trim();

                        // If code is empty, auto-generate it or find by name
                        if (string.IsNullOrEmpty(code))
                        {
                            var matchByName = await _context.SpareParts.FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower() && (s.Brand ?? "").ToLower() == brand.ToLower() && (s.Model ?? "").ToLower() == model.ToLower());
                            if (matchByName != null)
                            {
                                code = matchByName.Code;
                            }
                            else
                            {
                                if (type.Equals("Servicio", StringComparison.OrdinalIgnoreCase))
                                {
                                    code = $"SRV-{nextSrvNum++:D4}";
                                }
                                else
                                {
                                    code = $"ART-{nextArtNum++:D4}";
                                }
                            }
                        }

                        var categoryName = row.Cell(6).Value.ToString().Trim();
                        var unitName = row.Cell(7).Value.ToString().Trim();
                        var warehouseName = row.Cell(8).Value.ToString().Trim();
                        var locationName = row.Cell(9).Value.ToString().Trim();
                        
                        var costStr = row.Cell(10).Value.ToString().Trim().Replace(',', '.');
                        var stockStr = row.Cell(11).Value.ToString().Trim().Replace(',', '.');

                        decimal.TryParse(costStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var unitCost);
                        decimal.TryParse(stockStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var stock);

                        int? categoryId = await ResolveCategory(categoryName, cid);
                        int? unitId = await ResolveUnit(unitName, cid);
                        int? warehouseId = await ResolveWarehouse(warehouseName, cid);
                        int? locationId = await ResolveLocation(locationName, warehouseId, cid);

                        var existing = await _context.SpareParts.FirstOrDefaultAsync(s => s.Code == code);
                        if (existing != null)
                        {
                            existing.Name = name;
                            existing.ItemType = type;
                            if (!string.IsNullOrEmpty(brand)) existing.Brand = brand;
                            if (!string.IsNullOrEmpty(model)) existing.Model = model;
                            if (categoryId.HasValue) existing.CategoryId = categoryId;
                            if (unitId.HasValue) existing.UnitOfMeasureId = unitId;
                            if (warehouseId.HasValue) existing.WarehouseId = warehouseId;
                            if (locationId.HasValue) existing.LocationId = locationId;
                            if (unitCost > 0) existing.UnitCost = unitCost;
                            existing.StockQuantity = stock;
                            existing.IsActive = true;
                            updatedCount++;
                        }
                        else
                        {
                            sparePartsToAdd.Add(new SparePart
                            {
                                CompanyId = cid,
                                Code = code,
                                Name = name,
                                ItemType = type,
                                Brand = brand,
                                Model = model,
                                CategoryId = categoryId,
                                UnitOfMeasureId = unitId,
                                WarehouseId = warehouseId,
                                LocationId = locationId,
                                UnitCost = unitCost,
                                StockQuantity = stock,
                                IsActive = true,
                                RegistrationDate = DateTime.UtcNow
                            });
                            insertedCount++;
                        }
                    }
                }
            }

            if (sparePartsToAdd.Any())
            {
                _context.SpareParts.AddRange(sparePartsToAdd);
            }
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Importación completada: {insertedCount} artículos creados, {updatedCount} actualizados.",
                inserted = insertedCount,
                updated = updatedCount
            });
        }

        private async Task<int?> ResolveCategory(string name, int cid)
        {
            if (string.IsNullOrEmpty(name)) return null;
            var cat = await _context.SparePartCategories.FirstOrDefaultAsync(c => c.Name == name);
            if (cat == null)
            {
                cat = new SparePartCategory { Name = name, CompanyId = cid, IsActive = true };
                _context.SparePartCategories.Add(cat);
                await _context.SaveChangesAsync();
            }
            return cat.Id;
        }

        private async Task<int?> ResolveUnit(string name, int cid)
        {
            if (string.IsNullOrEmpty(name)) return null;
            var unit = await _context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Name == name);
            if (unit == null)
            {
                var abbv = name.Length > 10 ? name.Substring(0, 10) : name;
                unit = new UnitOfMeasure { Name = name, Abbreviation = abbv, CompanyId = cid, IsActive = true };
                _context.UnitsOfMeasure.Add(unit);
                await _context.SaveChangesAsync();
            }
            return unit.Id;
        }

        private async Task<int?> ResolveWarehouse(string name, int cid)
        {
            if (string.IsNullOrEmpty(name)) return null;
            var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == name);
            if (wh == null)
            {
                wh = new Warehouse { Name = name, CompanyId = cid, IsActive = true };
                _context.Warehouses.Add(wh);
                await _context.SaveChangesAsync();
            }
            return wh.Id;
        }

        private async Task<int?> ResolveLocation(string name, int? warehouseId, int cid)
        {
            if (string.IsNullOrEmpty(name) || !warehouseId.HasValue) return null;
            var loc = await _context.Locations.FirstOrDefaultAsync(l => l.Name == name && l.WarehouseId == warehouseId);
            if (loc == null)
            {
                loc = new Location { Name = name, WarehouseId = warehouseId.Value, CompanyId = cid, IsActive = true };
                _context.Locations.Add(loc);
                await _context.SaveChangesAsync();
            }
            return loc.Id;
        }
}
}


