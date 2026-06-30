import os
import re

# 1. Fix Fleet.tsx
fleet = r"TransportApp\Frontend\src\pages\Fleet.tsx"
with open(fleet, 'r', encoding='utf-8') as f: c = f.read()
c = c.replace("useState<number | ''>('')", "useState<any>('')")
with open(fleet, 'w', encoding='utf-8') as f: f.write(c)

# 2. Fix ServiceExecutionDetail.tsx
sed = r"TransportApp\Frontend\src\pages\ServiceExecutionDetail.tsx"
with open(sed, 'r', encoding='utf-8') as f: c = f.read()

# Fix import
c = re.sub(r'import \{([^\}]+)\} from \'lucide-react\';', lambda m: 'import {' + m.group(1).replace(', Trash2', '') + ', Trash2} from \'lucide-react\';', c)

# Insert handle
handler = """
  const handleDeleteRequisition = async (reqId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta requisición?')) return;
    try {
      await workshopService.deleteRequisition(reqId);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar la requisición.');
      console.error('Error deleting req:', error);
    }
  };

  const handleConsumeStock = async (e: React.FormEvent) => {"""

if 'const handleDeleteRequisition' not in c:
    c = c.replace("  const handleConsumeStock = async (e: React.FormEvent) => {", handler)

with open(sed, 'w', encoding='utf-8') as f: f.write(c)
