import re

with open('TransportApp/Backend/TransportManagement.API/Controllers/PhysicalInventoriesController.cs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Includes
target_block = """              var physicalInventory = await _context.PhysicalInventories
                  .Include(p => p.Warehouse)
                  .Include(p => p.Location)
                  .Include(p => p.Details)
                      .ThenInclude(d => d.SparePart)
                  .FirstOrDefaultAsync(p => p.Id == id);"""

new_block = """              var physicalInventory = await _context.PhysicalInventories
                  .Include(p => p.Warehouse)
                  .Include(p => p.Location)
                  .Include(p => p.Details)
                      .ThenInclude(d => d.SparePart)
                          .ThenInclude(s => s.SparePartUnits)
                              .ThenInclude(su => su.UnitOfMeasure)
                  .Include(p => p.Details)
                      .ThenInclude(d => d.SparePart)
                          .ThenInclude(s => s.UnitOfMeasure)
                  .FirstOrDefaultAsync(p => p.Id == id);"""

content = content.replace(target_block, new_block)

with open('TransportApp/Backend/TransportManagement.API/Controllers/PhysicalInventoriesController.cs', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
