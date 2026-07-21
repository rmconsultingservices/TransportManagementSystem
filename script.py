# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetchInventories();", "loadInventories();")

with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
