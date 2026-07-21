# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/services/physicalInventoryService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("await api.delete(/PhysicalInventories/);", "await api.delete(`/PhysicalInventories/${id}`);")

with open('TransportApp/Frontend/src/services/physicalInventoryService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
