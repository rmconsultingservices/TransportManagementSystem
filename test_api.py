import requests
import json

base_url = 'http://localhost:5025/api'

# Login
login_data = {
    'username': 'admin',
    'password': 'password123'
}
try:
    r = requests.post(f'{base_url}/Auth/login', json=login_data)
    token = r.json()['token']
except Exception as e:
    print('Login failed', e)
    exit(1)

# Create invoice
invoice_data = {
    'supplierId': 1,
    'invoiceNumber': 'TEST-001',
    'dateIssued': '2026-07-20T00:00:00.000Z',
    'paymentCondition': '001',
    'details': [
        {
            'sparePartId': 7,
            'quantityReceived': 1,
            'unitCost': 100,
            'taxPercentage': 16,
            'unitOfMeasureId': 6
        }
    ]
}

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

r2 = requests.post(f'{base_url}/PurchaseInvoices', json=invoice_data, headers=headers)
print('Status:', r2.status_code)
print('Body:', r2.text)
