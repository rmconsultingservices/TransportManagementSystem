import os

p = r"TransportApp\Frontend\src\pages\ServiceExecutionDetail.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

replacements = {
    "NÃºmero": "Número",
    "MecÃ¡nico": "Mecánico",
    "Ãº": "ú",
    "Ã¡": "á",
    "Ã³": "ó",
    "Ã©": "é",
    "Ã­": "í",
    "Ã±": "ñ",
    "ðŸ“…": "📅",
    "ðŸš›": "🚛",
    "ðŸ‘¨â€ ðŸ”§": "👨‍🔧",
    "EstÃ¡s": "Estás",
    "requisiciÃ³n": "requisición"
}

for k, v in replacements.items():
    c = c.replace(k, v)

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
