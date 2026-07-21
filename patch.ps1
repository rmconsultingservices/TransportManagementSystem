$path = 'TransportApp\Frontend\src\pages\Inventory.tsx'
$content = Get-Content -Path $path -Raw

# 1. Update imports
$content = $content -replace 'import type \{ SparePart, SparePartCategory, UnitOfMeasure \}', 'import type { SparePart, SparePartCategory, UnitOfMeasure, SparePartUnit }'

# 2. Add state variables
$stateVars = "
  const [sparePartUnits, setSparePartUnits] = useState<SparePartUnit[]>([]);
  const [multiUnit, setMultiUnit] = useState(false);
  const [newUnitId, setNewUnitId] = useState(0);
  const [newUnitEquiv, setNewUnitEquiv] = useState('');
  const [newUnitIsPrimary, setNewUnitIsPrimary] = useState(false);
  const [newUnitIsInverse, setNewUnitIsInverse] = useState(false);
"
$content = $content -replace '  const \[showForm, setShowForm\] = useState\(false\);', "  const [showForm, setShowForm] = useState(false);
$stateVars"

# 3. HandleSubmit payload
$content = $content -replace 'isActive: true', "isActive: true, sparePartUnits: multiUnit ? sparePartUnits : []"

# 4. resetForm
$resetVars = "
    setSparePartUnits([]);
    setMultiUnit(false);
    setNewUnitId(0);
    setNewUnitEquiv('');
    setNewUnitIsPrimary(false);
    setNewUnitIsInverse(false);
"
$content = $content -replace 'setRegistrationDate\(new Date\(\).toISOString\(\).split\('T'\)\[0\]\);', "setRegistrationDate(new Date().toISOString().split('T')[0]);
$resetVars"

# 5. handleEdit
$editVars = "
     setSparePartUnits(part.sparePartUnits || []);
     setMultiUnit((part.sparePartUnits && part.sparePartUnits.length > 0) ? true : false);
"
$content = $content -replace 'setShowForm\(true\);', "setShowForm(true);
$editVars"

Set-Content -Path $path -Value $content
