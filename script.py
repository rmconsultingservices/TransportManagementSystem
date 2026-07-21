# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables
content = content.replace("const [name, setName] = useState('');",
"""const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [presentation, setPresentation] = useState('');""", 1)

# 2. Add to handleEdit
content = content.replace("setName(part.name);",
"""setName(part.name);
    setBrand(part.brand || '');
    setModel(part.model || '');
    setPresentation(part.presentation || '');""", 1)

# 3. Add to handleAdd 
content = content.replace("setName('');",
"""setName('');
    setBrand('');
    setModel('');
    setPresentation('');""", 1)

# 4. Add to payload in handleSubmit
content = content.replace("""        name,
        estimatedLifeSpanKm""", """        name,
        brand,
        model,
        presentation,
        estimatedLifeSpanKm""", 1)

# 5. Add to JSX form
jsx_to_add = """            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
              <input 
                type="text" value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Ej. Caterpillar, Bosch..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
              <input 
                type="text" value={model} onChange={e => setModel(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Ej. F-150, T680..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presentación <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
              <input 
                type="text" value={presentation} onChange={e => setPresentation(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Ej. Pote 1L, Caja 12 uds..."
              />
            </div>
"""

import re
content = re.sub(
    r'(<input[^>]+value={name}[^>]+onChange={e => setName\(e.target.value\)}[^>]+/>\s*</div>)',
    r'\1\n' + jsx_to_add,
    content,
    count=1
)

with open('TransportApp/Frontend/src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Inventory.tsx Done")
