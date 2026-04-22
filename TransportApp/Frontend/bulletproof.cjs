const fs = require('fs');
let b = fs.readFileSync('c:/Users/58412/.gemini/antigravity/playground/vacant-station/TransportApp/Frontend/src/pages/InventoryAdjustments.tsx', 'utf8');

const parserFunc = `
  const safeNumber = (val: any) => {
    if (!val) return 0;
    const str = String(val).replace(/[^0-9,\\.-]/g, '').replace(/,/g, '.');
    return Number(str) || 0;
  };
`;

// Inject parserFunc right before HandleSubmit or fetch functions.
b = b.replace(/const fetchData = async/g, parserFunc + '\n  const fetchData = async');

// Update UI
b = b.replace(/\$\{\(\(Number\(String\(row\.quantity\)\.replace\(\/,\/g, '\.'\)\) \|\| 0\) \* \(Number\(String\(row\.unitCost\)\.replace\(\/,\/g, '\.'\)\) \|\| 0\)\)\.toFixed\(2\)\}/g, '${(safeNumber(row.quantity) * safeNumber(row.unitCost)).toFixed(2)}');

fs.writeFileSync('c:/Users/58412/.gemini/antigravity/playground/vacant-station/TransportApp/Frontend/src/pages/InventoryAdjustments.tsx', b);
