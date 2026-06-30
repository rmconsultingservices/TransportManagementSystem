import re

p = r"TransportApp\Frontend\src\pages\Inventory.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# 1. State
c = c.replace("const [code, setCode] = useState('');", "const [itemType, setItemType] = useState('Producto');\n  const [code, setCode] = useState('');")

# 2. resetForm
c = c.replace("setCode('');", "setItemType('Producto');\n    setCode('');")

# 3. handleEdit
c = c.replace("setCode(part.code);", "setItemType(part.itemType || 'Producto');\n     setCode(part.code);")

# 4. handleSubmit
c = c.replace("code,\n        name,", "itemType,\n        code,\n        name,")

# 5. Form field
form_field = """<div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de ArtÃ­culo</label>
                <select 
                  value={itemType} onChange={e => setItemType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Producto">Producto (Control de Stock)</option>
                  <option value="Servicio">Servicio (Mano de obra, etc.)</option>
                </select>
              </div>
              <div>"""
c = c.replace("              <div>\n                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">CÃ³digo SSR</label>", form_field + "\n                <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">CÃ³digo SSR</label>")

# 6. Table Badge
badge = """<span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ml-1 ${part.itemType === 'Servicio' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                           {part.itemType || 'Producto'}
                        </span>
                      </div>"""
c = c.replace("</span>\n                      </div>", "</span>\n                        " + badge)

# 7. Table Stock View
stock_view = """<div className={`text-2xl font-black ${
                          part.itemType === 'Servicio' ? 'text-purple-500' :
                          part.stockQuantity > 5 ? 'text-emerald-600' : 
                          part.stockQuantity > 0 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                         {part.itemType === 'Servicio' ? 'N/A' : part.stockQuantity} <span className="text-sm font-medium text-gray-500">{part.itemType === 'Servicio' ? 'Servicio' : (part.unitOfMeasure?.abbreviation || '-')}</span>
                      </div>"""

c = re.sub(r'<div className=\{`text-2xl font-black \$\{[^}]+?\}\}>.*?</div>', stock_view, c, flags=re.DOTALL)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
