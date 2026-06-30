p = r"TransportApp\Frontend\src\types\index.ts"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("export interface SparePart {", "export interface SparePart {\n    itemType?: string;")

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
