p = r"TransportApp\Frontend\src\pages\Inventory.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# Fix 1: Inject form select if missing
if "Tipo de ArtÃ­culo" not in c:
    select_html = """              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de ArtÃ­culo</label>
                <select 
                  value={itemType} onChange={e => setItemType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Producto">Producto (Control de Stock)</option>
                  <option value="Servicio">Servicio (Mano de obra, etc.)</option>
                </select>
              </div>
              
"""
    c = c.replace(
        "<div>\n                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">CÃ³digo SSR</label>",
        select_html + "<div>\n                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">CÃ³digo SSR</label>"
    )

# Fix 2: Repair the duplicated badge in the stock view and set the N/A logic
old_stock_view = """<div className={`text-2xl font-black ${
                          part.stockQuantity > 5 ? 'text-emerald-600' : 
                          part.stockQuantity > 0 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                         {part.stockQuantity} <span className="text-sm font-medium text-gray-500">{part.unitOfMeasure?.abbreviation || '-'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ml-1 ${part.itemType === 'Servicio' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                           {part.itemType || 'Producto'}
                        </span>
                      </div>"""

new_stock_view = """<div className={`text-2xl font-black ${
                          part.itemType === 'Servicio' ? 'text-purple-500' :
                          part.stockQuantity > 5 ? 'text-emerald-600' : 
                          part.stockQuantity > 0 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                         {part.itemType === 'Servicio' ? 'N/A' : part.stockQuantity} <span className="text-sm font-medium text-gray-500">{part.itemType === 'Servicio' ? 'Servicios' : (part.unitOfMeasure?.abbreviation || '-')}</span>
                      </div>"""

c = c.replace(old_stock_view, new_stock_view)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
