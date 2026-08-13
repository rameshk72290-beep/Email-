import os
import requests

BASE_URL = "https://email-cleanup-hub-2.preview.emergentagent.com"

# Core health, owner authentication, and protected inbox API regression checks.
def test_health_and_accounts():
    assert requests.get(BASE_URL + "/api/health", timeout=20).status_code == 200
    response = requests.get(BASE_URL + "/api/accounts", timeout=20)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_owner_login_and_invalid_login():
    good = requests.post(BASE_URL + "/api/admin/login", json={"username": "Ramesh", "password": "212006"}, timeout=20)
    assert good.status_code == 200 and good.json()["role"] == "owner"
    bad = requests.post(BASE_URL + "/api/admin/login", json={"username": "Ramesh", "password": "wrong"}, timeout=20)
    assert bad.status_code == 401

def test_protected_endpoints_reject_anonymous():
    assert requests.get(BASE_URL + "/api/emails", timeout=20).status_code == 401
    assert requests.post(BASE_URL + "/api/emails/trash", json={"email_ids": []}, timeout=20).status_code == 401
