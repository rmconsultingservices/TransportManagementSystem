p = r"TransportApp\Frontend\src\pages\Inventory.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

select_html = """            <div>
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

# Try to insert after the form tag
form_tag = "<form onSubmit={handleSubmit} className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n"

if "Tipo de ArtÃ­culo" not in c and form_tag in c:
    c = c.replace(form_tag, form_tag + select_html)
    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print("Success")
else:
    print("Not replaced. Exists:", "Tipo de ArtÃ­culo" in c, "Formtag:", form_tag in c)
