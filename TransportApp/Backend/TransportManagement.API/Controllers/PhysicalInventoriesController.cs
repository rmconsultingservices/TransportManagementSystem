using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using ClosedXML.Excel;
using System.IO;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class PhysicalInventoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PhysicalInventoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PhysicalInventories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PhysicalInventory>>> GetPhysicalInventories()
        {
            return await _context.PhysicalInventories
                .Include(p => p.Warehouse)
                .Include(p => p.Location)
                .OrderByDescending(p => p.DateStarted)
                .ToListAsync();
        }

        // GET: api/PhysicalInventories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PhysicalInventory>> GetPhysicalInventory(int id)
        {
            var physicalInventory = await _context.PhysicalInventories
                .Include(p => p.Warehouse)
                .Include(p => p.Location)
                .Include(p => p.Details)
                    .ThenInclude(d => d.SparePart)
                        .ThenInclude(s => s.SparePartUnits)
                            .ThenInclude(su => su.UnitOfMeasure)
                .Include(p => p.Details)
                    .ThenInclude(d => d.SparePart)
                        .ThenInclude(s => s.UnitOfMeasure)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (physicalInventory == null)
            {
                return NotFound();
            }

            return physicalInventory;
        }

        public class StartInventoryDto
        {
            public string Description { get; set; } = string.Empty;
            public int WarehouseId { get; set; }
            public int? LocationId { get; set; }
        }

        // POST: api/PhysicalInventories/start
        [HttpPost("start")]
        public async Task<ActionResult<PhysicalInventory>> StartPhysicalInventory([FromBody] StartInventoryDto dto)
        {
            var inventory = new PhysicalInventory
            {
                Description = dto.Description,
                WarehouseId = dto.WarehouseId,
                LocationId = dto.LocationId,
                DateStarted = DateTime.UtcNow,
                Status = "INITIATED",
                Number = "TEMP" // We will update this after getting the ID
            };

            _context.PhysicalInventories.Add(inventory);
            await _context.SaveChangesAsync();

            // Auto-generate number
            inventory.Number = $"INV-{DateTime.UtcNow:yyyyMMdd}-{inventory.Id:D4}";

            // Fetch spare parts
            var query = _context.SpareParts.Where(sp => sp.WarehouseId == dto.WarehouseId);
            
            if (dto.LocationId.HasValue)
            {
                query = query.Where(sp => sp.LocationId == dto.LocationId.Value);
            }

            var spareParts = await query.ToListAsync();

            foreach (var sp in spareParts)
            {
                inventory.Details.Add(new PhysicalInventoryDetail
                {
                    PhysicalInventoryId = inventory.Id,
                    SparePartId = sp.Id,
                    TheoreticalStock = sp.StockQuantity,
                    RealStock = 0, // default to 0
                    UnitCost = sp.UnitCost
                });
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPhysicalInventory), new { id = inventory.Id }, inventory);
        }

        public class UpdateResultsDto
        {
            public int SparePartId { get; set; }
            public decimal? RealStock { get; set; }
            public int? UnitOfMeasureId { get; set; }
        }

        // PUT: api/PhysicalInventories/5/results
        [HttpPut("{id}/results")]
        public async Task<IActionResult> UpdateResults(int id, [FromBody] List<UpdateResultsDto> results)
        {
            var inventory = await _context.PhysicalInventories
                .Include(p => p.Details)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (inventory == null) return NotFound();
            if (inventory.Status != "INITIATED") return BadRequest("El inventario ya fue procesado o cancelado.");

            foreach (var result in results)
            {
                var detail = inventory.Details.FirstOrDefault(d => d.SparePartId == result.SparePartId);
                if (detail != null)
                {
                    detail.RealStock = result.RealStock;
                    detail.UnitOfMeasureId = result.UnitOfMeasureId;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/PhysicalInventories/5/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelPhysicalInventory(int id)
        {
            var inventory = await _context.PhysicalInventories.FindAsync(id);
            if (inventory == null) return NotFound();
            if (inventory.Status != "INITIATED") return BadRequest("Solo los inventarios iniciados pueden ser anulados.");

            inventory.Status = "CANCELLED";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inventario anulado exitosamente." });
        }

        public class ProcessInventoryDto
        {
            public bool ZeroUncounted { get; set; } = false;
        }

        // POST: api/PhysicalInventories/5/process
        [HttpPost("{id}/process")]
        public async Task<IActionResult> ProcessInventory(int id, [FromBody] ProcessInventoryDto options)
        {
            var inventory = await _context.PhysicalInventories
                .Include(p => p.Details)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (inventory == null) return NotFound();
            if (inventory.Status != "INITIATED") return BadRequest("Solo se pueden procesar inventarios iniciados.");

            // Find all details
            var detailsToAdjust = inventory.Details.ToList();

            // We will create ONE InventoryAdjustment document for all differences
            var adjustment = new InventoryAdjustment
            {
                Date = DateTime.UtcNow,
                Remarks = $"Ajuste automático por Toma de Inventario {inventory.Number} ({inventory.Description})",
                CreatedBy = "Sistema",
                CompanyId = inventory.CompanyId
            };

            bool hasDifferences = false;

            foreach (var detail in detailsToAdjust)
            {
                decimal baseRealStock;
                if (detail.RealStock.HasValue)
                {
                    baseRealStock = await _context.GetBaseQuantityAsync(detail.SparePartId, detail.UnitOfMeasureId, detail.RealStock.Value);
                }
                else
                {
                    if (options.ZeroUncounted)
                    {
                        baseRealStock = 0;
                        detail.RealStock = 0;
                    }
                    else
                    {
                        baseRealStock = detail.TheoreticalStock;
                        detail.RealStock = detail.TheoreticalStock;
                    }
                }

                decimal diff = baseRealStock - detail.TheoreticalStock;

                if (diff != 0)
                {
                    hasDifferences = true;
                    
                    adjustment.Details.Add(new InventoryAdjustmentDetail
                    {
                        SparePartId = detail.SparePartId,
                        Type = diff > 0 ? "ENTRADA" : "SALIDA",
                        Quantity = Math.Abs(diff),
                        UnitCost = detail.UnitCost,
                        TotalCost = Math.Abs(diff) * detail.UnitCost,
                        UnitOfMeasureId = null
                    });

                    // Update actual stock
                    var sparePart = await _context.SpareParts.FindAsync(detail.SparePartId);
                    if (sparePart != null)
                    {
                        sparePart.StockQuantity = baseRealStock;
                    }
                }
            }

            if (hasDifferences && adjustment.Details.Any())
            {
                _context.InventoryAdjustments.Add(adjustment);
            }

            inventory.Status = "PROCESSED";
            inventory.DateProcessed = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Inventario procesado correctamente.", hasDifferences, adjustmentId = adjustment.Id });
        }
    
        // DELETE: api/PhysicalInventories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePhysicalInventory(int id)
        {
            try
            {
                var inventory = await _context.PhysicalInventories
                    .Include(i => i.Details)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (inventory == null)
                {
                    return NotFound();
                }

                if (inventory.Status == "PROCESSED")
                {
                    return BadRequest("No se puede eliminar una toma fisica que ya ha sido procesada.");
                }

                _context.PhysicalInventoryDetails.RemoveRange(inventory.Details);
                _context.PhysicalInventories.Remove(inventory);
                
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, inner = ex.InnerException?.Message });
            }
        }
        
        [HttpGet("export-template")]
        public async Task<IActionResult> ExportTemplate()
        {
            var spareParts = await _context.SpareParts
                .Include(s => s.Warehouse)
                .Include(s => s.Location)
                .Where(s => s.IsActive)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Plantilla_Toma_Fisica");

            worksheet.Cell(1, 1).Value = "Código";
            worksheet.Cell(1, 2).Value = "Descripción";
            worksheet.Cell(1, 3).Value = "Categoría";
            worksheet.Cell(1, 4).Value = "Unidad";
            worksheet.Cell(1, 5).Value = "Almacén";
            worksheet.Cell(1, 6).Value = "Ubicación";
            worksheet.Cell(1, 7).Value = "Stock Teórico";
            worksheet.Cell(1, 8).Value = "Conteo Físico"; // To be filled by user

            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < spareParts.Count; i++)
            {
                var row = i + 2;
                var part = spareParts[i];
                worksheet.Cell(row, 1).Value = part.Code;
                worksheet.Cell(row, 2).Value = part.Name;
                worksheet.Cell(row, 3).Value = part.Category?.Name ?? "";
                worksheet.Cell(row, 4).Value = part.UnitOfMeasure?.Abbreviation ?? "";
                worksheet.Cell(row, 5).Value = part.Warehouse?.Name ?? "";
                worksheet.Cell(row, 6).Value = part.Location?.Name ?? "";
                worksheet.Cell(row, 7).Value = part.StockQuantity;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Plantilla_Toma_Fisica.xlsx");
        }

                [HttpPost("import")]
        public async Task<IActionResult> ImportInventory(IFormFile file, [FromQuery] string remarks = "Toma física importada desde Excel")
        {
            if (file == null || file.Length == 0) return BadRequest("Archivo no válido");

            int cid = _context.CurrentCompanyId;

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                using (var workbook = new XLWorkbook(stream))
                {
                    var worksheet = workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null) return BadRequest("El archivo Excel no contiene hojas de trabajo.");

                    var range = worksheet.RangeUsed();
                    if (range == null || range.RowCount() <= 1)
                    {
                        return BadRequest("El archivo Excel está vacío o no contiene datos.");
                    }

                    var headerRow = range.Row(1);
                    int lastCol = range.ColumnCount();

                    // Detect columns by header name
                    int colCode = -1;
                    int colName = -1;
                    int colWarehouse = -1;
                    int colTheoretical = -1;
                    int colCount = -1;

                    for (int col = 1; col <= lastCol; col++)
                    {
                        var h = headerRow.Cell(col).GetString().Trim().ToLowerInvariant();
                        if (h.Contains("código") || h.Contains("codigo") || h == "code") colCode = col;
                        else if (h.Contains("descripci") || h.Contains("nombre") || h == "name" || h.Contains("artículo") || h.Contains("articulo")) colName = col;
                        else if (h.Contains("almacén") || h.Contains("almacen") || h == "warehouse") colWarehouse = col;
                        else if (h.Contains("teórico") || h.Contains("teorico") || h.Contains("sistema")) colTheoretical = col;
                        else if (h.Contains("conteo") || h.Contains("físico") || h.Contains("fisico") || h.Contains("real")) colCount = col;
                    }

                    // Fallbacks if not detected by header name:
                    // Standard template: 1=Código, 2=Descripción, 5=Almacén, 7=Stock Teórico, 8=Conteo Físico
                    if (colCode == -1) colCode = 1;
                    if (colName == -1 && lastCol >= 2) colName = 2;
                    if (colWarehouse == -1 && lastCol >= 5) colWarehouse = 5;
                    if (colTheoretical == -1 && lastCol >= 7) colTheoretical = 7;
                    if (colCount == -1 && lastCol >= 8) colCount = 8;

                    // Load all spare parts for current company into memory for fast matching
                    var allSpareParts = await _context.SpareParts
                        .Include(s => s.Warehouse)
                        .Where(s => s.IsActive)
                        .ToListAsync();

                    // Load warehouses
                    var warehouses = await _context.Warehouses.Where(w => w.IsActive).ToListAsync();

                    var dataRows = range.RowsUsed().Skip(1).ToList();

                    // Detect warehouse from rows or fallback to first warehouse
                    int? detectedWarehouseId = null;
                    if (colWarehouse != -1)
                    {
                        foreach (var row in dataRows)
                        {
                            var whName = row.Cell(colWarehouse).GetString().Trim();
                            if (!string.IsNullOrEmpty(whName))
                            {
                                var wh = warehouses.FirstOrDefault(w => w.Name.Equals(whName, StringComparison.OrdinalIgnoreCase));
                                if (wh != null)
                                {
                                    detectedWarehouseId = wh.Id;
                                    break;
                                }
                            }
                        }
                    }

                    if (!detectedWarehouseId.HasValue)
                    {
                        detectedWarehouseId = warehouses.FirstOrDefault()?.Id ?? 0;
                    }

                    var physicalInventory = new PhysicalInventory
                    {
                        CompanyId = cid,
                        Number = "INV-EXCEL-" + DateTime.UtcNow.ToString("yyyyMMddHHmm"),
                        Description = remarks,
                        WarehouseId = detectedWarehouseId.Value,
                        DateStarted = DateTime.UtcNow,
                        Status = "INITIATED",
                        Details = new List<PhysicalInventoryDetail>()
                    };

                    var adjustment = new InventoryAdjustment
                    {
                        CompanyId = cid,
                        Date = DateTime.UtcNow,
                        Remarks = "Ajuste automático por toma física Excel: " + physicalInventory.Number,
                        CreatedBy = "Sistema",
                        Details = new List<InventoryAdjustmentDetail>()
                    };

                    bool hasDifferences = false;
                    int countedCount = 0;
                    int totalMatched = 0;

                    foreach (var row in dataRows)
                    {
                        var code = colCode != -1 ? row.Cell(colCode).GetString().Trim() : "";
                        var name = colName != -1 ? row.Cell(colName).GetString().Trim() : "";

                        if (string.IsNullOrEmpty(code) && string.IsNullOrEmpty(name))
                            continue;

                        // Match spare part by code, or by name if code is empty/not found
                        SparePart? sparePart = null;
                        if (!string.IsNullOrEmpty(code))
                        {
                            sparePart = allSpareParts.FirstOrDefault(s => s.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
                        }
                        if (sparePart == null && !string.IsNullOrEmpty(name))
                        {
                            sparePart = allSpareParts.FirstOrDefault(s => s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                        }

                        if (sparePart == null)
                            continue;

                        totalMatched++;

                        // Check if count is present
                        decimal? realCount = null;
                        if (colCount != -1)
                        {
                            var countCell = row.Cell(colCount);
                            if (!countCell.IsEmpty())
                            {
                                var countStr = countCell.GetString().Trim().Replace(',', '.');
                                if (decimal.TryParse(countStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedCount))
                                {
                                    realCount = parsedCount;
                                }
                                else if (countCell.TryGetValue<decimal>(out var numCount))
                                {
                                    realCount = numCount;
                                }
                            }
                        }

                        var systemStock = sparePart.StockQuantity;

                        var detail = new PhysicalInventoryDetail
                        {
                            SparePartId = sparePart.Id,
                            TheoreticalStock = systemStock,
                            RealStock = realCount,
                            UnitCost = sparePart.UnitCost,
                            UnitOfMeasureId = sparePart.UnitOfMeasureId
                        };

                        physicalInventory.Details.Add(detail);

                        if (realCount.HasValue)
                        {
                            countedCount++;
                            var diff = realCount.Value - systemStock;
                            if (diff != 0)
                            {
                                hasDifferences = true;
                                adjustment.Details.Add(new InventoryAdjustmentDetail
                                {
                                    SparePartId = sparePart.Id,
                                    Type = diff > 0 ? "ENTRADA" : "SALIDA",
                                    Quantity = Math.Abs(diff),
                                    UnitCost = sparePart.UnitCost,
                                    TotalCost = Math.Abs(diff) * sparePart.UnitCost,
                                    UnitOfMeasureId = sparePart.UnitOfMeasureId
                                });

                                sparePart.StockQuantity = realCount.Value;
                            }
                        }
                    }

                    if (physicalInventory.Details.Count == 0)
                    {
                        return BadRequest("No se encontraron artículos coincidentes en el archivo Excel con el catálogo del sistema.");
                    }

                    // If at least one item was counted AND all items were counted, we can mark as PROCESSED
                    if (countedCount > 0 && countedCount == physicalInventory.Details.Count)
                    {
                        physicalInventory.Status = "PROCESSED";
                        physicalInventory.DateProcessed = DateTime.UtcNow;
                    }
                    else
                    {
                        // Items pending count! Keep as INITIATED so the user can continue and review in the web UI!
                        physicalInventory.Status = "INITIATED";
                    }

                    _context.PhysicalInventories.Add(physicalInventory);

                    // Only add adjustment if processed
                    if (physicalInventory.Status == "PROCESSED" && hasDifferences)
                    {
                        _context.InventoryAdjustments.Add(adjustment);
                    }

                    await _context.SaveChangesAsync();

                    string statusMsg = physicalInventory.Status == "PROCESSED" 
                        ? $"Toma física procesada exitosamente con {totalMatched} artículos ({countedCount} contados)." 
                        : $"Toma física creada exitosamente con {totalMatched} artículos ({countedCount} con conteo, {totalMatched - countedCount} pendientes por contar).";

                    return Ok(new { 
                        message = statusMsg, 
                        id = physicalInventory.Id,
                        totalArticles = totalMatched,
                        counted = countedCount,
                        pending = totalMatched - countedCount,
                        status = physicalInventory.Status
                    });
                }
            }
        }
    }
}
