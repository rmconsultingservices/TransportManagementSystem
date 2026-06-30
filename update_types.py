import re
p = r"TransportApp\Frontend\src\types\index.ts"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

if "itemType?:" not in c:
    c = re.sub(r'(export interface SparePart \{[^}]+?)(?=\})', r'\1  itemType?: string;\n', c)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
