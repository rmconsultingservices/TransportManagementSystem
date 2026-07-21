import sys

with open('Frontend/src/components/InvoicesTab.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if '<th className="px-4 py-3 min-w-[280px]">Art' in line and 'Repuesto destino</th>' in line:
        new_lines.append(line)
        new_lines.append('                   <th className="px-4 py-3 w-32">Unidad</th>\n')
        i += 1
        continue
    
    if '<SparePartSelector' in line:
        # We need to append the UnitSelector after this <td> block ends
        while i < len(lines):
            new_lines.append(lines[i])
            if '</td>' in lines[i]:
                # Now add the UnitSelector block
                new_lines.append('                       <td className="px-4 py-2 min-w-[120px]">\n')
                new_lines.append('                          <UnitSelector\n')
                new_lines.append('                            sparePartId={d.sparePartId || \'\'}\n')
                new_lines.append('                            spareParts={parts}\n')
                new_lines.append('                            value={d.unitOfMeasureId || \'\'}\n')
                new_lines.append('                            onChange={id => updateLine(index, \'unitOfMeasureId\', id)}\n')
                new_lines.append('                          />\n')
                new_lines.append('                       </td>\n')
                i += 1
                break
            i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open('Frontend/src/components/InvoicesTab.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done!')
