using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TransportManagement.API.Controllers
{
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ApiController]
    public class ServiceRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiceRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ServiceRequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceRequest>>> GetServiceRequests()
        {
            return await _context.ServiceRequests
                .Include(s => s.Vehicle)
                .Include(s => s.Trailer)
                .Include(s => s.Driver)
                .Include(s => s.Mechanic)
                .Include(s => s.Execution)
                .Include(s => s.Activities)
                .OrderByDescending(s => s.DateRequested)
                .ToListAsync();
        }

        // GET: api/ServiceRequests/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceRequest>> GetServiceRequest(int id)
        {
            var serviceRequest = await _context.ServiceRequests
                .Include(s => s.Vehicle)
                .Include(s => s.Trailer)
                .Include(s => s.Driver)
                .Include(s => s.Mechanic)
                .Include(s => s.Activities)
                .Include(s => s.Logs.OrderByDescending(l => l.CreatedAt))
                .Include(s => s.Requisitions.OrderByDescending(r => r.DateRequested))
                .Include(s => s.Execution)
                    .ThenInclude(e => e.UsedSpareParts)
                        .ThenInclude(usp => usp.SparePart)
                .AsSplitQuery()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (serviceRequest == null)
            {
                return NotFound();
            }

            return serviceRequest;
        }

        // POST: api/ServiceRequests
        [HttpPost]
        public async Task<ActionResult<ServiceRequest>> PostServiceRequest(ServiceRequest serviceRequest)
        {
            serviceRequest.DateRequested = DateTime.UtcNow;
            serviceRequest.Status = "Pendiente";
            
            _context.ServiceRequests.Add(serviceRequest);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceRequest", new { id = serviceRequest.Id }, serviceRequest);
        }

        public class AssignMechanicDto
        {
            public int MechanicId { get; set; }
        }

        // PUT: api/ServiceRequests/5/AssignMechanic
        [HttpPut("{id}/AssignMechanic")]
        public async Task<IActionResult> AssignMechanic(int id, [FromBody] AssignMechanicDto dto)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            if (request == null) return NotFound();

            request.MechanicId = dto.MechanicId;
            request.Status = "En Revisión";

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/ServiceRequests/5/Logs
        [HttpPost("{id}/Logs")]
        public async Task<ActionResult<ServiceLog>> AddLog(int id, [FromBody] ServiceLog log)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            if (request == null) return NotFound();

            log.ServiceRequestId = id;
            log.CreatedAt = DateTime.UtcNow;
            
            _context.ServiceLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(log);
        }

        // POST: api/ServiceRequests/5/Requisitions
        [HttpPost("{id}/Requisitions")]
        public async Task<ActionResult<PurchaseRequisition>> AddRequisition(int id, [FromBody] PurchaseRequisition req)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            if (request == null) return NotFound();

            req.ServiceRequestId = id;
            req.DateRequested = DateTime.UtcNow;
            req.Status = "Pendiente";
            
            _context.PurchaseRequisitions.Add(req);
            await _context.SaveChangesAsync();

            return Ok(req);
        }

        public class AddUsedPartDto
        {
            public int SparePartId { get; set; }
            public int Quantity { get; set; }
        }

        // POST: api/ServiceRequests/5/UsedParts
        [HttpPost("{id}/UsedParts")]
        public async Task<ActionResult<ServiceExecutionSparePart>> AddUsedPart(int id, [FromBody] AddUsedPartDto dto)
        {
            var request = await _context.ServiceRequests
                .Include(r => r.Execution)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (request == null) return NotFound();

            var part = await _context.SpareParts.FindAsync(dto.SparePartId);
            if (part == null) return NotFound("Spare part not found.");

            if (part.StockQuantity < dto.Quantity)
                return BadRequest("Insufficient stock.");

            // Ensure execution exists
            if (request.Execution == null)
            {
                request.Execution = new ServiceExecution { ServiceRequestId = id };
                _context.ServiceExecutions.Add(request.Execution);
                await _context.SaveChangesAsync();
            }

            var usedPart = new ServiceExecutionSparePart
            {
                ServiceExecutionId = request.Execution.Id,
                SparePartId = dto.SparePartId,
                Quantity = dto.Quantity
            };

            // Deduct from stock
            part.StockQuantity -= dto.Quantity;

            _context.ServiceExecutionSpareParts.Add(usedPart);
            await _context.SaveChangesAsync();

            return Ok(usedPart);
        }

        // POST: api/ServiceRequests/5/Execute
        [HttpPost("{id}/Execute")]
        public async Task<IActionResult> ExecuteService(int id, [FromBody] ServiceExecution execution)
        {
            var request = await _context.ServiceRequests
                .Include(r => r.Execution)
                .Include(r => r.Vehicle)
                .Include(r => r.Trailer)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (request == null) return NotFound();

            if (request.Execution == null)
            {
                execution.ServiceRequestId = id;
                execution.DateCompleted = DateTime.UtcNow;
                _context.ServiceExecutions.Add(execution);
            }
            else
            {
                request.Execution.FinalObservations = execution.FinalObservations;
                request.Execution.DiagnosisObservations = execution.DiagnosisObservations;
                request.Execution.MileageAtService = execution.MileageAtService;
                request.Execution.DateCompleted = DateTime.UtcNow;
            }
            
            request.Status = "Completado";

            // Update mileage
            var mileage = execution.MileageAtService ?? (request.Execution?.MileageAtService);
            if (mileage.HasValue)
            {
                if (request.VehicleId.HasValue && request.Vehicle != null)
                {
                    request.Vehicle.CurrentMileage = mileage.Value;
                    request.Vehicle.LastMaintenanceMileage = mileage.Value;
                }
                else if (request.TrailerId.HasValue && request.Trailer != null)
                {
                    request.Trailer.CurrentMileage = mileage.Value;
                    request.Trailer.LastMaintenanceMileage = mileage.Value;
                }
            }

            // --- AUTO-CREATE MAINTENANCE ORDER ---
            var maintenanceOrder = new MaintenanceOrder
            {
                CompanyId = request.CompanyId,
                VehicleId = request.VehicleId,
                TrailerId = request.TrailerId,
                ServiceRequestId = request.Id,
                Date = DateTime.UtcNow,
                Type = request.RepairType,
                MileageAtMaintenance = mileage ?? 0,
                MechanicAssigned = request.Mechanic?.Name ?? "Varios",
                Notes = $"Servicio completado desde Ticket #{request.Id}. " + (execution.FinalObservations ?? "")
            };
            _context.MaintenanceOrders.Add(maintenanceOrder);
            // -------------------------------------

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
