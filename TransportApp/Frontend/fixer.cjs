const fs = require('fs');
let b = fs.readFileSync('c:/Users/58412/.gemini/antigravity/playground/vacant-station/TransportApp/Frontend/src/pages/InventoryAdjustments.tsx', 'utf8');

b = b.replace(/\$\{row\.totalCost\.toFixed\(2\)\}/g, '${((Number(String(row.quantity).replace(/,/g, \'.\')) || 0) * (Number(String(row.unitCost).replace(/,/g, \'.\')) || 0)).toFixed(2)}');

b = b.replace(/type="number" min="1" step="1" value=\{row\.quantity \|\| ''\}/g, 'type="text" value={row.quantity || \'\'}');
b = b.replace(/onChange=\{e => updateRow\(i, 'quantity', e\.target\.value === '' \? '' : parseInt\(e\.target\.value\) \|\| 0\)\}/g, 'onChange={e => updateRow(i, \'quantity\', e.target.value)}');

b = b.replace(/type="number" min="0" step="0\.01" value=\{row\.unitCost \|\| ''\}/g, 'type="text" value={row.unitCost || \'\'}');
b = b.replace(/onChange=\{e => updateRow\(i, 'unitCost', e\.target\.value === '' \? '' : Number\(e\.target\.value\)\)\}/g, 'onChange={e => updateRow(i, \'unitCost\', e.target.value)}');

fs.writeFileSync('c:/Users/58412/.gemini/antigravity/playground/vacant-station/TransportApp/Frontend/src/pages/InventoryAdjustments.tsx', b);
