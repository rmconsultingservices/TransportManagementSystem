import re

# Update SparePartsController
p1 = r"TransportApp\Backend\TransportManagement.API\Controllers\SparePartsController.cs"
with open(p1, "r", encoding="utf-8") as f:
    c1 = f.read()

c1 = c1.replace("existingPart.Name = sparePart.Name;", "existingPart.Name = sparePart.Name;\n            existingPart.ItemType = sparePart.ItemType;")
with open(p1, "w", encoding="utf-8") as f:
    f.write(c1)

# Update ServiceRequestsController
p2 = r"TransportApp\Backend\TransportManagement.API\Controllers\ServiceRequestsController.cs"
with open(p2, "r", encoding="utf-8") as f:
    c2 = f.read()

c2 = c2.replace("if (part.StockQuantity < dto.Quantity)", "if (part.ItemType != \"Servicio\" && part.StockQuantity < dto.Quantity)")
c2 = c2.replace("part.StockQuantity -= dto.Quantity;", "if (part.ItemType != \"Servicio\")\n            {\n                part.StockQuantity -= dto.Quantity;\n            }")

with open(p2, "w", encoding="utf-8") as f:
    f.write(c2)
