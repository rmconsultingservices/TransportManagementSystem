p = r"TransportApp\Frontend\src\pages\Inventory.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# Normalize line endings for reliable replacement
c = c.replace("\r\n", "\n")

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

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
