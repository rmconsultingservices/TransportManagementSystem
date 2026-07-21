with open("TransportApp/Frontend/src/pages/Fleet.tsx", 'rb') as f:
    content = f.read()

idx = content.find(b'Hu')
if idx != -1:
    print(content[idx:idx+20])
