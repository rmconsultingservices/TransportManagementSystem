# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setShowForm(true);\n  };", 
"""setShowForm(true);\n    setSparePartUnits(part.sparePartUnits || []);\n    setMultiUnit((part.sparePartUnits && part.sparePartUnits.length > 0) ? true : false);\n  };""", 1)

with open('TransportApp/Frontend/src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored multi units to handleEdit")
