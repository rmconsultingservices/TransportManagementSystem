import urllib.request
import json
import urllib.error

# 1. Login
login_data = json.dumps({"username": "admin", "password": "admin"}).encode('utf-8')
req = urllib.request.Request('http://localhost:5024/api/Auth/login', data=login_data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode())
        token = res_data.get('token')
        print("Logged in")
except urllib.error.URLError as e:
    print("Login failed:", e)
    token = None

# 2. Get inventories
if token:
    req = urllib.request.Request('http://localhost:5024/api/PhysicalInventories', headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as response:
            inventories = json.loads(response.read().decode())
            print(f"Got {len(inventories)} inventories")
            # 3. Delete the first INITIATED inventory
            initiated = [i for i in inventories if i['status'] == 'INITIATED']
            if initiated:
                target = initiated[0]
                print(f"Deleting inventory {target['id']}")
                req = urllib.request.Request(f"http://localhost:5024/api/PhysicalInventories/{target['id']}", method='DELETE', headers={'Authorization': f'Bearer {token}'})
                try:
                    with urllib.request.urlopen(req) as response:
                        print("Deleted:", response.status)
                except urllib.error.HTTPError as e:
                    print("Delete failed:", e.code, e.read().decode())
            else:
                print("No INITIATED inventories found")
    except urllib.error.URLError as e:
        print("Get failed:", e)
