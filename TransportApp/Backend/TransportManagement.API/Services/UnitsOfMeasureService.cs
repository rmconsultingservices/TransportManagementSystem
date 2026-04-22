using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TransportManagement.API.Data;
using TransportManagement.API.Models;
using System;
using System.Linq;

namespace TransportManagement.API.Services
{
    public class UnitsOfMeasureService : IUnitsOfMeasureService
    {
        private readonly AppDbContext _context;

        public UnitsOfMeasureService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UnitOfMeasure>> GetAllAsync(bool includeInactive = false)
        {
            var query = _context.UnitsOfMeasure.AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(u => u.IsActive);
            }

            return await query.OrderBy(u => u.Name).ToListAsync();
        }

        public async Task<UnitOfMeasure?> GetByIdAsync(int id)
        {
            return await _context.UnitsOfMeasure.FindAsync(id);
        }

        public async Task<UnitOfMeasure> CreateAsync(UnitOfMeasure unit)
        {
            _context.UnitsOfMeasure.Add(unit);
            await _context.SaveChangesAsync();
            return unit;
        }

        public async Task UpdateAsync(int id, UnitOfMeasure unit)
        {
            var existing = await _context.UnitsOfMeasure.FindAsync(id);
            if (existing == null) throw new ArgumentException("Unit not found");

            existing.Name = unit.Name;
            existing.Abbreviation = unit.Abbreviation;
            existing.IsActive = unit.IsActive;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var existing = await _context.UnitsOfMeasure.FindAsync(id);
            if (existing == null) throw new ArgumentException("Unit not found");

            _context.UnitsOfMeasure.Remove(existing);
            await _context.SaveChangesAsync();
        }
    }
}
