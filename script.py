import os
filepath = "TransportApp/Backend/TransportManagement.API/Controllers/SparePartsController.cs"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """            existingPart.Code = sparePart.Code;
            existingPart.Name = sparePart.Name;
            existingPart.ItemType = sparePart.ItemType;
            existingPart.Brand = sparePart.Brand;
            existingPart.Model = sparePart.Model;
            existingPart.Presentation = sparePart.Presentation;
            existingPart.UnitOfMeasureId = sparePart.UnitOfMeasureId;"""

content = content.replace("""            existingPart.Code = sparePart.Code;
            existingPart.Name = sparePart.Name;
            existingPart.ItemType = sparePart.ItemType;
            existingPart.UnitOfMeasureId = sparePart.UnitOfMeasureId;""", replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed PutSparePart")
