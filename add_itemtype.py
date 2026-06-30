import re
p = r"TransportApp\Backend\TransportManagement.API\Models\SparePart.cs"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# Insert after Name
if "ItemType" not in c:
    c = re.sub(r'(public string Name \{ get; set; \} = string\.Empty;)', r'\1\n        public string ItemType { get; set; } = "Producto";', c)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
