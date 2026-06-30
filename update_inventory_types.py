p = r"TransportApp\Frontend\src\types\inventory.ts"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("export interface SparePart {\n  id: number;", "export interface SparePart {\n  id: number;\n  itemType?: string;")

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
