with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix import
old_import = "import { Plus, Search, MapPin, PackageOpen, ClipboardList, AlertCircle, Play, Eye, FileText, FileDown } from 'lucide-react';"
new_import = "import { Plus, Search, MapPin, PackageOpen, ClipboardList, AlertCircle, Play, Eye, FileText, FileDown, Trash2 } from 'lucide-react';"
content = content.replace(old_import, new_import)

# Fix API call
old_call = "await api.delete(`/api/PhysicalInventories/${id}`);"
new_call = "await physicalInventoryService.delete(id);"
content = content.replace(old_call, new_call)

with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
