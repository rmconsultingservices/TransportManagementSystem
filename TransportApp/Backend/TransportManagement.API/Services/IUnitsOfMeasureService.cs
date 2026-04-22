using System.Collections.Generic;
using System.Threading.Tasks;
using TransportManagement.API.Models;

namespace TransportManagement.API.Services
{
    public interface IUnitsOfMeasureService
    {
        Task<IEnumerable<UnitOfMeasure>> GetAllAsync(bool includeInactive = false);
        Task<UnitOfMeasure?> GetByIdAsync(int id);
        Task<UnitOfMeasure> CreateAsync(UnitOfMeasure unit);
        Task UpdateAsync(int id, UnitOfMeasure unit);
        Task DeleteAsync(int id);
    }
}
