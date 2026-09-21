using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;

namespace TransportManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. INDICADORES OPERATIVOS (FLOTA Y SERVICIOS)
        // ==========================================
        [HttpGet("operational-kpis")]
        public async Task<ActionResult<OperationalKpisDto>> GetOperationalKpis([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var (start, end) = NormalizeDateRange(startDate, endDate);

            // Flota Activa
            var vehicles = await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
            var trailers = await _context.Trailers.Where(t => t.IsActive).ToListAsync();

            // Unidades actualmente inmovilizadas en taller (solicitud no completada)
            var activeServices = await _context.ServiceRequests
                .Where(sr => sr.Status != "Completado")
                .Select(sr => new { sr.VehicleId, sr.TrailerId })
                .ToListAsync();

            var inWorkshopVehicleIds = activeServices.Where(s => s.VehicleId.HasValue).Select(s => s.VehicleId!.Value).ToHashSet();
            var inWorkshopTrailerIds = activeServices.Where(s => s.TrailerId.HasValue).Select(s => s.TrailerId!.Value).ToHashSet();

            int inWorkshopVehicles = vehicles.Count(v => inWorkshopVehicleIds.Contains(v.Id));
            int inWorkshopTrailers = trailers.Count(t => inWorkshopTrailerIds.Contains(t.Id));
            int inWorkshopTotal = inWorkshopVehicles + inWorkshopTrailers;

            int totalVehicles = vehicles.Count;
            int totalTrailers = trailers.Count;
            int totalUnits = totalVehicles + totalTrailers;

            int operationalVehicles = Math.Max(0, totalVehicles - inWorkshopVehicles);
            int operationalTrailers = Math.Max(0, totalTrailers - inWorkshopTrailers);
            int operationalTotal = operationalVehicles + operationalTrailers;

            double fleetAvailPercent = totalUnits > 0 ? Math.Round((double)operationalTotal / totalUnits * 100, 1) : 100.0;
            double vehicleAvailPercent = totalVehicles > 0 ? Math.Round((double)operationalVehicles / totalVehicles * 100, 1) : 100.0;
            double trailerAvailPercent = totalTrailers > 0 ? Math.Round((double)operationalTrailers / totalTrailers * 100, 1) : 100.0;

            // MTTR (Tiempo Medio de Reparación) para órdenes completadas en el rango
            var completedOrders = await _context.ServiceRequests
                .Include(sr => sr.Execution)
                .Where(sr => sr.Status == "Completado" 
                             && sr.Execution != null 
                             && sr.Execution.DateCompleted >= start 
                             && sr.Execution.DateCompleted <= end)
                .ToListAsync();

            double totalHours = 0;
            int validMttrOrders = 0;

            foreach (var order in completedOrders)
            {
                if (order.Execution?.DateCompleted != null && order.Execution.DateCompleted >= order.DateRequested)
                {
                    totalHours += (order.Execution.DateCompleted.Value - order.DateRequested).TotalHours;
                    validMttrOrders++;
                }
            }

            double mttrHours = validMttrOrders > 0 ? Math.Round(totalHours / validMttrOrders, 1) : 0.0;
            double mttrDays = Math.Round(mttrHours / 24.0, 1);

            // Preventivos vs Correctivos en el período
            var periodRequests = await _context.ServiceRequests
                .Where(sr => sr.DateRequested >= start && sr.DateRequested <= end)
                .ToListAsync();

            int preventiveCount = periodRequests.Count(r => (r.RepairType ?? "").ToLower().Contains("prev"));
            int correctiveCount = periodRequests.Count(r => (r.RepairType ?? "").ToLower().Contains("corr"));
            int otherCount = periodRequests.Count - (preventiveCount + correctiveCount);
            int totalReqs = periodRequests.Count;

            double prevPercent = totalReqs > 0 ? Math.Round((double)preventiveCount / totalReqs * 100, 1) : 0.0;
            double corrPercent = totalReqs > 0 ? Math.Round((double)correctiveCount / totalReqs * 100, 1) : 0.0;

            // Frecuencia de Fallas por Unidad en el período
            var vehicleMap = vehicles.ToDictionary(v => v.Id);
            var trailerMap = trailers.ToDictionary(t => t.Id);

            var failureByVehicle = periodRequests
                .Where(r => r.VehicleId.HasValue)
                .GroupBy(r => r.VehicleId!.Value)
                .Select(g => {
                    var v = vehicleMap.GetValueOrDefault(g.Key);
                    return new UnitFailureFrequencyDto
                    {
                        Id = g.Key,
                        LicensePlate = v?.LicensePlate ?? $"Vehículo #{g.Key}",
                        UnitType = "Chuto",
                        BrandOrType = v?.Brand ?? "",
                        Model = v?.Model ?? "",
                        TotalFailures = g.Count(),
                        CorrectiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("corr")),
                        PreventiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("prev")),
                        LastServiceDate = g.Max(x => (DateTime?)x.DateRequested)
                    };
                });

            var failureByTrailer = periodRequests
                .Where(r => r.TrailerId.HasValue)
                .GroupBy(r => r.TrailerId!.Value)
                .Select(g => {
                    var t = trailerMap.GetValueOrDefault(g.Key);
                    return new UnitFailureFrequencyDto
                    {
                        Id = g.Key,
                        LicensePlate = t?.LicensePlate ?? $"Remolque #{g.Key}",
                        UnitType = "Remolque",
                        BrandOrType = t?.Type ?? "",
                        Model = $"{t?.AxlesCount ?? 0} Ejes",
                        TotalFailures = g.Count(),
                        CorrectiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("corr")),
                        PreventiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("prev")),
                        LastServiceDate = g.Max(x => (DateTime?)x.DateRequested)
                    };
                });

            var topFailures = failureByVehicle.Concat(failureByTrailer)
                .OrderByDescending(f => f.TotalFailures)
                .ThenByDescending(f => f.CorrectiveCount)
                .Take(10)
                .ToList();

            return Ok(new OperationalKpisDto
            {
                TotalActiveVehicles = totalVehicles,
                TotalActiveTrailers = totalTrailers,
                TotalActiveUnits = totalUnits,
                InWorkshopVehicles = inWorkshopVehicles,
                InWorkshopTrailers = inWorkshopTrailers,
                InWorkshopTotal = inWorkshopTotal,
                OperationalVehicles = operationalVehicles,
                OperationalTrailers = operationalTrailers,
                OperationalTotal = operationalTotal,
                FleetAvailabilityPercent = fleetAvailPercent,
                VehiclesAvailabilityPercent = vehicleAvailPercent,
                TrailersAvailabilityPercent = trailerAvailPercent,
                MttrHours = mttrHours,
                MttrDays = mttrDays,
                CompletedOrdersCount = validMttrOrders,
                PreventiveCount = preventiveCount,
                CorrectiveCount = correctiveCount,
                OtherTypeCount = otherCount,
                TotalRequestsCount = totalReqs,
                PreventivePercent = prevPercent,
                CorrectivePercent = corrPercent,
                FailureFrequency = topFailures
            });
        }

        // ==========================================
        // 2. CONTROL FINANCIERO Y DE COSTOS
        // ==========================================
        [HttpGet("financial-kpis")]
        public async Task<ActionResult<FinancialKpisDto>> GetFinancialKpis([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var (start, end) = NormalizeDateRange(startDate, endDate);

            // Obtener repuestos usados en ejecuciones dentro del rango de fecha
            var usedParts = await _context.ServiceExecutionSpareParts
                .Include(p => p.ServiceExecution)
                    .ThenInclude(e => e!.ServiceRequest)
                        .ThenInclude(sr => sr!.Vehicle)
                .Include(p => p.ServiceExecution)
                    .ThenInclude(e => e!.ServiceRequest)
                        .ThenInclude(sr => sr!.Trailer)
                .Where(p => p.ServiceExecution != null 
                            && p.ServiceExecution.DateCompleted >= start 
                            && p.ServiceExecution.DateCompleted <= end)
                .ToListAsync();

            decimal totalCost = usedParts.Sum(p => p.Quantity * p.UnitCost);

            // Contar unidades distintas atendidas
            var distinctVehicles = usedParts
                .Where(p => p.ServiceExecution?.ServiceRequest?.VehicleId.HasValue == true)
                .Select(p => p.ServiceExecution!.ServiceRequest!.VehicleId!.Value)
                .Distinct();

            var distinctTrailers = usedParts
                .Where(p => p.ServiceExecution?.ServiceRequest?.TrailerId.HasValue == true)
                .Select(p => p.ServiceExecution!.ServiceRequest!.TrailerId!.Value)
                .Distinct();

            int servicedUnitsCount = distinctVehicles.Count() + distinctTrailers.Count();
            decimal averageCostPerUnit = servicedUnitsCount > 0 ? Math.Round(totalCost / servicedUnitsCount, 2) : 0;

            // Top 5 Vehículos con Mayor Gasto
            var vehicleSpending = usedParts
                .Where(p => p.ServiceExecution?.ServiceRequest?.VehicleId.HasValue == true)
                .GroupBy(p => p.ServiceExecution!.ServiceRequest!.Vehicle!)
                .Select(g => new TopSpendingVehicleDto
                {
                    Id = g.Key.Id,
                    LicensePlate = g.Key.LicensePlate,
                    UnitType = "Chuto",
                    BrandModel = $"{g.Key.Brand} {g.Key.Model}".Trim(),
                    TotalCost = Math.Round(g.Sum(x => x.Quantity * x.UnitCost), 2),
                    ServicesCount = g.Select(x => x.ServiceExecutionId).Distinct().Count(),
                    PartsCount = (int)g.Sum(x => x.Quantity)
                });

            var trailerSpending = usedParts
                .Where(p => p.ServiceExecution?.ServiceRequest?.TrailerId.HasValue == true)
                .GroupBy(p => p.ServiceExecution!.ServiceRequest!.Trailer!)
                .Select(g => new TopSpendingVehicleDto
                {
                    Id = g.Key.Id,
                    LicensePlate = g.Key.LicensePlate,
                    UnitType = "Remolque",
                    BrandModel = $"{g.Key.Type} ({g.Key.AxlesCount} Ejes)".Trim(),
                    TotalCost = Math.Round(g.Sum(x => x.Quantity * x.UnitCost), 2),
                    ServicesCount = g.Select(x => x.ServiceExecutionId).Distinct().Count(),
                    PartsCount = (int)g.Sum(x => x.Quantity)
                });

            var top5Spending = vehicleSpending.Concat(trailerSpending)
                .OrderByDescending(v => v.TotalCost)
                .Take(5)
                .ToList();

            // Valor Total de Inventario Inmovilizado (> 90 días)
            var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

            // Repuestos con stock > 0
            var allActiveParts = await _context.SpareParts
                .Where(s => s.IsActive && s.StockQuantity > 0)
                .ToListAsync();

            // IDs con movimiento en los últimos 90 días
            var recentUsedPartIds = await _context.ServiceExecutionSpareParts
                .Where(p => p.ServiceExecution != null && p.ServiceExecution.DateCompleted >= ninetyDaysAgo)
                .Select(p => p.SparePartId)
                .Distinct()
                .ToListAsync();

            var recentAdjustmentsPartIds = await _context.InventoryAdjustmentDetails
                .Where(d => d.InventoryAdjustment != null && d.InventoryAdjustment.Date >= ninetyDaysAgo)
                .Select(d => d.SparePartId)
                .Distinct()
                .ToListAsync();

            var recentInvoicePartIds = await _context.PurchaseInvoiceDetails
                .Where(d => d.PurchaseInvoice != null && d.PurchaseInvoice.DateIssued >= ninetyDaysAgo)
                .Select(d => d.SparePartId)
                .Distinct()
                .ToListAsync();

            var partsWithRecentMovement = recentUsedPartIds
                .Union(recentAdjustmentsPartIds)
                .Union(recentInvoicePartIds)
                .ToHashSet();

            var immobilizedParts = allActiveParts
                .Where(s => !partsWithRecentMovement.Contains(s.Id) && s.RegistrationDate < ninetyDaysAgo)
                .ToList();

            decimal immobilizedValue = Math.Round(immobilizedParts.Sum(s => s.StockQuantity * s.UnitCost), 2);
            int immobilizedCount = immobilizedParts.Count;

            return Ok(new FinancialKpisDto
            {
                TotalMaintenanceCost = Math.Round(totalCost, 2),
                AverageCostPerServicedUnit = averageCostPerUnit,
                ServicedUnitsCount = servicedUnitsCount,
                ImmobilizedInventoryValue = immobilizedValue,
                ImmobilizedItemsCount = immobilizedCount,
                TopSpendingVehicles = top5Spending
            });
        }

        // ==========================================
        // 3. GESTIÓN DE INVENTARIO (REPUESTOS)
        // ==========================================
        [HttpGet("inventory-kpis")]
        public async Task<ActionResult<InventoryKpisDto>> GetInventoryKpis([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var (start, end) = NormalizeDateRange(startDate, endDate);

            // Total Valoración de Inventario Actual
            var allParts = await _context.SpareParts
                .Include(s => s.Category)
                .Include(s => s.UnitOfMeasure)
                .Where(s => s.IsActive)
                .ToListAsync();

            decimal totalValuation = Math.Round(allParts.Sum(s => s.StockQuantity * s.UnitCost), 2);

            // Alertas de Quiebre de Stock (StockQuantity <= MinimumStock o StockQuantity <= 0)
            var stockoutAlerts = allParts
                .Where(s => s.StockQuantity <= s.MinimumStock || s.StockQuantity <= 0)
                .OrderBy(s => s.StockQuantity)
                .Select(s => new StockoutAlertDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    Name = s.Name,
                    Category = s.Category?.Name ?? "Sin Categoría",
                    StockQuantity = s.StockQuantity,
                    MinimumStock = s.MinimumStock,
                    UnitCost = s.UnitCost,
                    UnitOfMeasure = !string.IsNullOrEmpty(s.UnitOfMeasure?.Abbreviation) ? s.UnitOfMeasure.Abbreviation : (s.UnitOfMeasure?.Name ?? "UND"),
                    Status = s.StockQuantity <= 0 ? "AGOTADO" : "STOCK CRÍTICO"
                })
                .ToList();

            // Índice de Rotación: Repuestos más consumidos en el período
            var usedParts = await _context.ServiceExecutionSpareParts
                .Include(p => p.SparePart)
                    .ThenInclude(sp => sp!.Category)
                .Include(p => p.SparePart)
                    .ThenInclude(sp => sp!.UnitOfMeasure)
                .Where(p => p.ServiceExecution != null 
                            && p.ServiceExecution.DateCompleted >= start 
                            && p.ServiceExecution.DateCompleted <= end)
                .ToListAsync();

            var topTurnover = usedParts
                .Where(p => p.SparePart != null)
                .GroupBy(p => p.SparePart!)
                .Select(g => new SparePartTurnoverDto
                {
                    Id = g.Key.Id,
                    Code = g.Key.Code,
                    Name = g.Key.Name,
                    Category = g.Key.Category?.Name ?? "General",
                    TotalQuantityConsumed = g.Sum(x => x.Quantity),
                    TotalCostConsumed = Math.Round(g.Sum(x => x.Quantity * x.UnitCost), 2),
                    UnitOfMeasure = !string.IsNullOrEmpty(g.Key.UnitOfMeasure?.Abbreviation) ? g.Key.UnitOfMeasure.Abbreviation : (g.Key.UnitOfMeasure?.Name ?? "UND"),
                    ServiceOrdersCount = g.Select(x => x.ServiceExecutionId).Distinct().Count()
                })
                .OrderByDescending(t => t.TotalQuantityConsumed)
                .Take(10)
                .ToList();

            return Ok(new InventoryKpisDto
            {
                TotalInventoryValuation = totalValuation,
                StockoutAlertsCount = stockoutAlerts.Count,
                StockoutAlerts = stockoutAlerts,
                TopTurnoverParts = topTurnover
            });
        }

        // ==========================================
        // 4. RENDIMIENTO DE PERSONAL
        // ==========================================
        [HttpGet("staff-kpis")]
        public async Task<ActionResult<StaffKpisDto>> GetStaffKpis([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var (start, end) = NormalizeDateRange(startDate, endDate);

            // 1. Productividad por Mecánico
            var completedOrders = await _context.ServiceRequests
                .Include(sr => sr.Mechanic)
                .Include(sr => sr.Execution)
                    .ThenInclude(e => e!.UsedSpareParts)
                .Where(sr => sr.Status == "Completado" 
                             && sr.Execution != null 
                             && sr.Execution.DateCompleted >= start 
                             && sr.Execution.DateCompleted <= end)
                .ToListAsync();

            var mechanicProductivity = completedOrders
                .Where(sr => sr.Mechanic != null)
                .GroupBy(sr => sr.Mechanic!)
                .Select(g => {
                    var hoursList = g.Where(x => x.Execution?.DateCompleted != null && x.Execution.DateCompleted >= x.DateRequested)
                                     .Select(x => (x.Execution!.DateCompleted!.Value - x.DateRequested).TotalHours)
                                     .ToList();
                    double avgHours = hoursList.Any() ? Math.Round(hoursList.Average(), 1) : 0.0;
                    decimal partsInstalled = g.Sum(x => x.Execution?.UsedSpareParts?.Sum(p => p.Quantity) ?? 0);

                    return new MechanicProductivityDto
                    {
                        MechanicId = g.Key.Id,
                        MechanicName = g.Key.Name,
                        Speciality = g.Key.Speciality ?? "",
                        CompletedOrders = g.Count(),
                        AverageRepairTimeHours = avgHours,
                        TotalPartsInstalledCount = partsInstalled
                    };
                })
                .OrderByDescending(m => m.CompletedOrders)
                .ToList();

            // 2. Incidencias por Chofer Solicitante
            var requestsWithDriver = await _context.ServiceRequests
                .Include(sr => sr.Driver)
                .Where(sr => sr.DateRequested >= start && sr.DateRequested <= end && sr.Driver != null)
                .ToListAsync();

            var driverIncidents = requestsWithDriver
                .GroupBy(sr => sr.Driver!)
                .Select(g => new DriverIncidentsDto
                {
                    DriverId = g.Key.Id,
                    DriverName = g.Key.Name,
                    LicenseNumber = g.Key.LicenseNumber,
                    TotalIncidents = g.Count(),
                    CorrectiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("corr")),
                    PreventiveCount = g.Count(x => (x.RepairType ?? "").ToLower().Contains("prev")),
                    LastIncidentDate = g.Max(x => (DateTime?)x.DateRequested)
                })
                .OrderByDescending(d => d.TotalIncidents)
                .ThenByDescending(d => d.CorrectiveCount)
                .Take(10)
                .ToList();

            return Ok(new StaffKpisDto
            {
                MechanicProductivity = mechanicProductivity,
                DriverIncidents = driverIncidents
            });
        }

        // ==========================================
        // 5. EXPORTACIÓN EJECUTIVA A EXCEL
        // ==========================================
        [HttpGet("export-excel")]
        public async Task<IActionResult> ExportExecutiveExcel([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var (start, end) = NormalizeDateRange(startDate, endDate);

            var opRes = await GetOperationalKpis(start, end);
            var finRes = await GetFinancialKpis(start, end);
            var invRes = await GetInventoryKpis(start, end);
            var staffRes = await GetStaffKpis(start, end);

            var opKpis = (opRes.Result as OkObjectResult)?.Value as OperationalKpisDto ?? opRes.Value ?? new OperationalKpisDto();
            var finKpis = (finRes.Result as OkObjectResult)?.Value as FinancialKpisDto ?? finRes.Value ?? new FinancialKpisDto();
            var invKpis = (invRes.Result as OkObjectResult)?.Value as InventoryKpisDto ?? invRes.Value ?? new InventoryKpisDto();
            var staffKpis = (staffRes.Result as OkObjectResult)?.Value as StaffKpisDto ?? staffRes.Value ?? new StaffKpisDto();

            using var workbook = new XLWorkbook();

            // Pestaña 1: Resumen Ejecutivo
            var wsSummary = workbook.Worksheets.Add("Resumen Ejecutivo");
            wsSummary.Cell(1, 1).Value = "REPORTE GERENCIAL DE FLOTA Y MANTENIMIENTO";
            wsSummary.Cell(1, 1).Style.Font.Bold = true;
            wsSummary.Cell(1, 1).Style.Font.FontSize = 16;
            wsSummary.Cell(2, 1).Value = $"Período: {start:dd/MM/yyyy} al {end:dd/MM/yyyy}";
            wsSummary.Cell(2, 1).Style.Font.Italic = true;

            int row = 4;
            void AddKpiRow(IXLWorksheet ws, ref int r, string category, string metric, string value)
            {
                ws.Cell(r, 1).Value = category;
                ws.Cell(r, 2).Value = metric;
                ws.Cell(r, 3).Value = value;
                r++;
            }

            wsSummary.Cell(row, 1).Value = "Pilar";
            wsSummary.Cell(row, 2).Value = "Indicador";
            wsSummary.Cell(row, 3).Value = "Valor";
            wsSummary.Range(row, 1, row, 3).Style.Font.Bold = true;
            wsSummary.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A8A");
            wsSummary.Range(row, 1, row, 3).Style.Font.FontColor = XLColor.White;
            row++;

            AddKpiRow(wsSummary, ref row, "Operativo", "Disponibilidad de Flota Global", $"{opKpis.FleetAvailabilityPercent}%");
            AddKpiRow(wsSummary, ref row, "Operativo", "Disponibilidad de Chutos", $"{opKpis.VehiclesAvailabilityPercent}%");
            AddKpiRow(wsSummary, ref row, "Operativo", "Disponibilidad de Remolques", $"{opKpis.TrailersAvailabilityPercent}%");
            AddKpiRow(wsSummary, ref row, "Operativo", "Tiempo Medio de Reparación (MTTR)", $"{opKpis.MttrDays} días ({opKpis.MttrHours} hrs)");
            AddKpiRow(wsSummary, ref row, "Operativo", "Servicios Preventivos", $"{opKpis.PreventiveCount} ({opKpis.PreventivePercent}%)");
            AddKpiRow(wsSummary, ref row, "Operativo", "Servicios Correctivos", $"{opKpis.CorrectiveCount} ({opKpis.CorrectivePercent}%)");
            AddKpiRow(wsSummary, ref row, "Financiero", "Costo Total de Mantenimiento", $"$ {finKpis.TotalMaintenanceCost:N2}");
            AddKpiRow(wsSummary, ref row, "Financiero", "Costo Promedio por Unidad Atendida", $"$ {finKpis.AverageCostPerServicedUnit:N2}");
            AddKpiRow(wsSummary, ref row, "Financiero", "Unidades Atendidas en Período", $"{finKpis.ServicedUnitsCount}");
            AddKpiRow(wsSummary, ref row, "Financiero", "Inventario Inmovilizado (> 90 días)", $"$ {finKpis.ImmobilizedInventoryValue:N2} ({finKpis.ImmobilizedItemsCount} ítems)");
            AddKpiRow(wsSummary, ref row, "Inventario", "Valoración Total Inventario Actual", $"$ {invKpis.TotalInventoryValuation:N2}");
            AddKpiRow(wsSummary, ref row, "Inventario", "Alertas de Quiebre de Stock", $"{invKpis.StockoutAlertsCount} repuestos");
            AddKpiRow(wsSummary, ref row, "Personal", "Órdenes Completadas por Mecánicos", $"{staffKpis.MechanicProductivity.Sum(m => m.CompletedOrders)}");
            AddKpiRow(wsSummary, ref row, "Personal", "Incidencias Reportadas por Choferes", $"{staffKpis.DriverIncidents.Sum(d => d.TotalIncidents)}");
            wsSummary.Columns().AdjustToContents();

            // Pestaña 2: Top Gastos
            var wsFin = workbook.Worksheets.Add("Top Vehiculos Mayor Gasto");
            wsFin.Cell(1, 1).Value = "TOP VEHÍCULOS CON MAYOR GASTO EN MANTENIMIENTO";
            wsFin.Cell(1, 1).Style.Font.Bold = true;
            string[] finHeaders = { "Placa", "Tipo", "Marca / Modelo", "Costo Total ($)", "Cant. Servicios", "Repuestos Usados" };
            for (int i = 0; i < finHeaders.Length; i++)
            {
                wsFin.Cell(3, i + 1).Value = finHeaders[i];
            }
            wsFin.Range(3, 1, 3, finHeaders.Length).Style.Font.Bold = true;
            wsFin.Range(3, 1, 3, finHeaders.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A8A");
            wsFin.Range(3, 1, 3, finHeaders.Length).Style.Font.FontColor = XLColor.White;

            int fRow = 4;
            foreach (var v in finKpis.TopSpendingVehicles)
            {
                wsFin.Cell(fRow, 1).Value = v.LicensePlate;
                wsFin.Cell(fRow, 2).Value = v.UnitType;
                wsFin.Cell(fRow, 3).Value = v.BrandModel;
                wsFin.Cell(fRow, 4).Value = v.TotalCost;
                wsFin.Cell(fRow, 4).Style.NumberFormat.Format = "$#,##0.00";
                wsFin.Cell(fRow, 5).Value = v.ServicesCount;
                wsFin.Cell(fRow, 6).Value = v.PartsCount;
                fRow++;
            }
            wsFin.Columns().AdjustToContents();

            // Pestaña 3: Quiebres de Stock
            var wsStock = workbook.Worksheets.Add("Alertas Quiebre de Stock");
            wsStock.Cell(1, 1).Value = "REPUESTOS EN QUIEBRE O STOCK CRÍTICO";
            wsStock.Cell(1, 1).Style.Font.Bold = true;
            string[] stockHeaders = { "Código", "Repuesto", "Categoría", "Stock Actual", "Stock Mínimo", "Costo Unitario ($)", "Estado" };
            for (int i = 0; i < stockHeaders.Length; i++)
            {
                wsStock.Cell(3, i + 1).Value = stockHeaders[i];
            }
            wsStock.Range(3, 1, 3, stockHeaders.Length).Style.Font.Bold = true;
            wsStock.Range(3, 1, 3, stockHeaders.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#B91C1C");
            wsStock.Range(3, 1, 3, stockHeaders.Length).Style.Font.FontColor = XLColor.White;

            int sRow = 4;
            foreach (var a in invKpis.StockoutAlerts)
            {
                wsStock.Cell(sRow, 1).Value = a.Code;
                wsStock.Cell(sRow, 2).Value = a.Name;
                wsStock.Cell(sRow, 3).Value = a.Category;
                wsStock.Cell(sRow, 4).Value = a.StockQuantity;
                wsStock.Cell(sRow, 5).Value = a.MinimumStock;
                wsStock.Cell(sRow, 6).Value = a.UnitCost;
                wsStock.Cell(sRow, 6).Style.NumberFormat.Format = "$#,##0.00";
                wsStock.Cell(sRow, 7).Value = a.Status;
                sRow++;
            }
            wsStock.Columns().AdjustToContents();

            // Pestaña 4: Personal
            var wsStaff = workbook.Worksheets.Add("Rendimiento Personal");
            wsStaff.Cell(1, 1).Value = "PRODUCTIVIDAD DE MECÁNICOS";
            wsStaff.Cell(1, 1).Style.Font.Bold = true;
            string[] mHeaders = { "Mecánico", "Especialidad", "Órdenes Cerradas", "MTTR Promedio (hrs)", "Repuestos Instalados" };
            for (int i = 0; i < mHeaders.Length; i++) wsStaff.Cell(3, i + 1).Value = mHeaders[i];
            wsStaff.Range(3, 1, 3, mHeaders.Length).Style.Font.Bold = true;
            wsStaff.Range(3, 1, 3, mHeaders.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A8A");
            wsStaff.Range(3, 1, 3, mHeaders.Length).Style.Font.FontColor = XLColor.White;

            int mRow = 4;
            foreach (var m in staffKpis.MechanicProductivity)
            {
                wsStaff.Cell(mRow, 1).Value = m.MechanicName;
                wsStaff.Cell(mRow, 2).Value = m.Speciality;
                wsStaff.Cell(mRow, 3).Value = m.CompletedOrders;
                wsStaff.Cell(mRow, 4).Value = m.AverageRepairTimeHours;
                wsStaff.Cell(mRow, 5).Value = m.TotalPartsInstalledCount;
                mRow++;
            }

            mRow += 2;
            wsStaff.Cell(mRow, 1).Value = "INCIDENCIAS POR CHOFER";
            wsStaff.Cell(mRow, 1).Style.Font.Bold = true;
            mRow++;
            string[] dHeaders = { "Chofer", "Licencia", "Total Incidencias", "Correctivas", "Preventivas", "Último Reporte" };
            for (int i = 0; i < dHeaders.Length; i++) wsStaff.Cell(mRow, i + 1).Value = dHeaders[i];
            wsStaff.Range(mRow, 1, mRow, dHeaders.Length).Style.Font.Bold = true;
            wsStaff.Range(mRow, 1, mRow, dHeaders.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#4B5563");
            wsStaff.Range(mRow, 1, mRow, dHeaders.Length).Style.Font.FontColor = XLColor.White;
            mRow++;

            foreach (var d in staffKpis.DriverIncidents)
            {
                wsStaff.Cell(mRow, 1).Value = d.DriverName;
                wsStaff.Cell(mRow, 2).Value = d.LicenseNumber;
                wsStaff.Cell(mRow, 3).Value = d.TotalIncidents;
                wsStaff.Cell(mRow, 4).Value = d.CorrectiveCount;
                wsStaff.Cell(mRow, 5).Value = d.PreventiveCount;
                wsStaff.Cell(mRow, 6).Value = d.LastIncidentDate.HasValue ? d.LastIncidentDate.Value.ToString("dd/MM/yyyy") : "-";
                mRow++;
            }
            wsStaff.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(
                content, 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Reporte_Gerencial_{start:yyyyMMdd}_{end:yyyyMMdd}.xlsx"
            );
        }

        private static (DateTime start, DateTime end) NormalizeDateRange(DateTime? startDate, DateTime? endDate)
        {
            var end = (endDate ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
            var start = (startDate ?? DateTime.UtcNow.AddDays(-30)).Date;
            return (start, end);
        }
    }

    // ==========================================
    // DATA TRANSFER OBJECTS (DTOs)
    // ==========================================
    public class OperationalKpisDto
    {
        public int TotalActiveVehicles { get; set; }
        public int TotalActiveTrailers { get; set; }
        public int TotalActiveUnits { get; set; }
        public int InWorkshopVehicles { get; set; }
        public int InWorkshopTrailers { get; set; }
        public int InWorkshopTotal { get; set; }
        public int OperationalVehicles { get; set; }
        public int OperationalTrailers { get; set; }
        public int OperationalTotal { get; set; }
        public double FleetAvailabilityPercent { get; set; }
        public double VehiclesAvailabilityPercent { get; set; }
        public double TrailersAvailabilityPercent { get; set; }

        public double MttrHours { get; set; }
        public double MttrDays { get; set; }
        public int CompletedOrdersCount { get; set; }

        public int PreventiveCount { get; set; }
        public int CorrectiveCount { get; set; }
        public int OtherTypeCount { get; set; }
        public int TotalRequestsCount { get; set; }
        public double PreventivePercent { get; set; }
        public double CorrectivePercent { get; set; }

        public List<UnitFailureFrequencyDto> FailureFrequency { get; set; } = new();
    }

    public class UnitFailureFrequencyDto
    {
        public int Id { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string UnitType { get; set; } = string.Empty;
        public string BrandOrType { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int TotalFailures { get; set; }
        public int CorrectiveCount { get; set; }
        public int PreventiveCount { get; set; }
        public DateTime? LastServiceDate { get; set; }
    }

    public class FinancialKpisDto
    {
        public decimal TotalMaintenanceCost { get; set; }
        public decimal AverageCostPerServicedUnit { get; set; }
        public int ServicedUnitsCount { get; set; }
        public decimal ImmobilizedInventoryValue { get; set; }
        public int ImmobilizedItemsCount { get; set; }
        public List<TopSpendingVehicleDto> TopSpendingVehicles { get; set; } = new();
    }

    public class TopSpendingVehicleDto
    {
        public int Id { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string UnitType { get; set; } = string.Empty;
        public string BrandModel { get; set; } = string.Empty;
        public decimal TotalCost { get; set; }
        public int ServicesCount { get; set; }
        public int PartsCount { get; set; }
    }

    public class InventoryKpisDto
    {
        public decimal TotalInventoryValuation { get; set; }
        public int StockoutAlertsCount { get; set; }
        public List<StockoutAlertDto> StockoutAlerts { get; set; } = new();
        public List<SparePartTurnoverDto> TopTurnoverParts { get; set; } = new();
    }

    public class StockoutAlertDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal StockQuantity { get; set; }
        public decimal MinimumStock { get; set; }
        public decimal UnitCost { get; set; }
        public string UnitOfMeasure { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class SparePartTurnoverDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal TotalQuantityConsumed { get; set; }
        public decimal TotalCostConsumed { get; set; }
        public string UnitOfMeasure { get; set; } = string.Empty;
        public int ServiceOrdersCount { get; set; }
    }

    public class StaffKpisDto
    {
        public List<MechanicProductivityDto> MechanicProductivity { get; set; } = new();
        public List<DriverIncidentsDto> DriverIncidents { get; set; } = new();
    }

    public class MechanicProductivityDto
    {
        public int MechanicId { get; set; }
        public string MechanicName { get; set; } = string.Empty;
        public string Speciality { get; set; } = string.Empty;
        public int CompletedOrders { get; set; }
        public double AverageRepairTimeHours { get; set; }
        public decimal TotalPartsInstalledCount { get; set; }
    }

    public class DriverIncidentsDto
    {
        public int DriverId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public int TotalIncidents { get; set; }
        public int CorrectiveCount { get; set; }
        public int PreventiveCount { get; set; }
        public DateTime? LastIncidentDate { get; set; }
    }
}
