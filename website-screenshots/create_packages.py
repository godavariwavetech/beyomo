# -*- coding: utf-8 -*-
import json
import urllib.request

BASE = "http://localhost:3000"


def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode('utf-8') if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode('utf-8'))


login = req('POST', '/api/v1/admin/auth/login', body={"email": "admin@beyomo.com", "password": "Admin@123"})
token = login['data']['token']
print('logged in')

svcs = json.load(open('D:/client/beyomo_/website-screenshots/all_services.json', encoding='utf-8'))
by_id = {s['id']: s for s in svcs}

tiers = json.load(open('D:/client/beyomo_/website-screenshots/resolved_tiers.json', encoding='utf-8'))

# Deactivate the 3 old generic flexible packages (9, 10, 11) instead of deleting,
# to preserve referential integrity for any historical bookings.
for old_id in (9, 10, 11):
    try:
        req('PUT', f'/api/v1/admin/packages/{old_id}', token=token, body={"isActive": False})
        print('deactivated old package', old_id)
    except Exception as e:
        print('failed to deactivate', old_id, e)

created = []
for tier in tiers:
    services = []
    for sid in tier['serviceIds']:
        s = by_id[sid]
        services.append({
            "serviceId": s['id'],
            "name": s['name'],
            "price": float(s['basePrice']),
            "duration": s.get('duration'),
            "image": s.get('image'),
        })
    payload = {
        "title": tier['title'],
        "description": f"Choose any {tier['count']} services from our curated range",
        "image": None,
        "packageType": "flexible",
        "price": tier['price'],
        "originalPrice": tier['originalPrice'],
        "isActive": True,
        "showOnHome": False,
        "cityIds": [],
        "validFrom": None,
        "validTill": None,
        "services": services,
        "serviceCount": tier['count'],
        "categoryId": None,
        "adminPercent": 20,
        "partnerPercent": 80,
        "gstPercent": 5,
    }
    res = req('POST', '/api/v1/admin/packages', token=token, body=payload)
    pid = res.get('data', {}).get('id')
    created.append((pid, tier['title']))
    print('created', pid, tier['title'], '-', len(services), 'eligible services')

print()
print('DONE. Created:', created)
