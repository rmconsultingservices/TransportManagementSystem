import os
import re

p = r"TransportApp\Frontend\src\pages\ServiceExecutionDetail.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Import Wrench
if "Wrench" not in c:
    c = re.sub(r'import \{([^\}]+)\} from \'lucide-react\';', lambda m: 'import {' + m.group(1) + ', Wrench} from \'lucide-react\';', c)

# 2. Replace corrupted text
c = c.replace("<span>ðŸ‘¨â€ ðŸ”§", "<span><Wrench size={14} className=\"inline mr-1 text-gray-500\" />")

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
