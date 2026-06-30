p = r"TransportApp\Frontend\src\pages\Inventory.tsx"
with open(p, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("ArtÃ­culo", "Artículo")
c = c.replace("CÃ³digo", "Código")
c = c.replace("CatÃ¡logo", "Catálogo")
c = c.replace("AlmacÃ©n", "Almacén")
c = c.replace("almacÃ©n", "almacén")
c = c.replace("AÃ±adir", "Añadir")
c = c.replace("SintÃ©tico", "Sintético")
c = c.replace("UbicaciÃ³n", "Ubicación")
c = c.replace("Ãºtil", "útil")
c = c.replace("Ã¡", "á")
c = c.replace("Ã©", "é")
c = c.replace("Ã­", "í")
c = c.replace("Ã³", "ó")
c = c.replace("Ãº", "ú")
c = c.replace("Â¿", "¿")
c = c.replace("Ã‘", "Ñ")
c = c.replace("Ã±", "ñ")

with open(p, "w", encoding="utf-8") as f:
    f.write(c)
