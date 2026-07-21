import os

filepath = "TransportApp/Frontend/src/pages/Inventory.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Descripci\ufffdn", "Descripción")
content = content.replace("Acci\ufffdn", "Acción")
content = content.replace("Categor\ufffda", "Categoría")
content = content.replace("Categor\ufffdas", "Categorías")
content = content.replace("Ubicaci\ufffdn", "Ubicación")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Inventory.tsx all U+FFFD encoding fixed")
