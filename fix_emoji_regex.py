import os
import re

p = r"TransportApp\Frontend\src\pages\ServiceExecutionDetail.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# Replace any characters between <span> and Mecánico:
c = re.sub(r'<span>[^<]*Mecánico:', r'<span><Wrench size={16} className="inline mr-1.5 text-gray-400" /> Mecánico:', c)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
