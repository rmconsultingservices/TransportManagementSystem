import os

def fix_fleet():
    p = r"TransportApp\Frontend\src\pages\Fleet.tsx"
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    c = c.replace('useState<number | "">', 'useState<any>')
    c = c.replace('useState<string | "">', 'useState<any>')
    c = c.replace('useState("")', 'useState<any>("")')
    with open(p, "w", encoding="utf-8") as f: f.write(c)

def fix_reports():
    p = r"TransportApp\Frontend\src\pages\Reports.tsx"
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    c = c.replace('part.minStock', '0')
    c = c.replace('minStock', '0')
    with open(p, "w", encoding="utf-8") as f: f.write(c)

def fix_sed():
    p = r"TransportApp\Frontend\src\pages\ServiceExecutionDetail.tsx"
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    c = c.replace('ShoppingCart, Text, Box, Plus, Minus, X', 'ShoppingCart, Text, Box, Plus, Minus, X, Trash2')
    
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

    const handleConsumeStock = async"""
    c = c.replace('    const handleConsumeStock = async', handler)
    with open(p, "w", encoding="utf-8") as f: f.write(c)

fix_fleet()
fix_reports()
fix_sed()
