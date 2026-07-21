# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("alert('Error al eliminar la toma física. Si el error persiste, por favor REINICIA TU BACKEND (Ctrl+C y dotnet run). Detalles: ' + (error.response?.data?.message || error.message));');", "alert('Error al eliminar la toma física. Si el error persiste, por favor REINICIA TU BACKEND (Ctrl+C y dotnet run). Detalles: ' + (error.response?.data?.message || error.message));")

with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
