# -*- coding: utf-8 -*-
with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for Trash2
content = content.replace("import { Search, Plus, Play, Eye, ClipboardList, MapPin, PackageOpen, AlertCircle } from 'lucide-react';", "import { Search, Plus, Play, Eye, ClipboardList, MapPin, PackageOpen, AlertCircle, Trash2 } from 'lucide-react';")

# Add handleDelete method
handle_delete_method = """  const handleStartInventory = async (e: React.FormEvent) => {
    e.preventDefault();
"""
new_handle_delete = """  const handleDelete = async (id: number) => {
    if (window.confirm('Esta seguro de eliminar esta toma fisica? Esta accion no se puede deshacer.')) {
      try {
        await api.delete(/api/PhysicalInventories/);
        fetchInventories();
      } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('Error al eliminar la toma fisica.');
      }
    }
  };

  const handleStartInventory = async (e: React.FormEvent) => {
    e.preventDefault();
"""
if "const handleDelete =" not in content:
    content = content.replace(handle_delete_method, new_handle_delete)

# Update actions column
target_actions = """                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(/inventory/physical/)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-end gap-1 w-full"
                      >
                        {inv.status === 'PROCESSED' ? <><Eye size={18} /> Ver</> : <><Play size={18} /> Continuar</>}
                      </button>
                    </td>"""

new_actions = """                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-4 items-center">
                        <button
                          onClick={() => navigate(/inventory/physical/)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                        >
                          {inv.status === 'PROCESSED' ? <><Eye size={18} /> Ver</> : <><Play size={18} /> Continuar</>}
                        </button>
                        {inv.status !== 'PROCESSED' && (
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>"""
content = content.replace(target_actions, new_actions)

with open('TransportApp/Frontend/src/pages/PhysicalInventories.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done frontend script.")
