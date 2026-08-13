import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/")
    assert response.status_code == 200
    assert "Dynamic Multi-Gmail" in response.json()["message"]

@pytest.mark.anyio
async def test_get_accounts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/accounts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.anyio
async def test_admin_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Invalid
        resp_fail = await ac.post("/api/admin/login", json={"username": "Wrong", "password": "123"})
        assert resp_fail.status_code == 401

        # Valid Ramesh / 212006
        resp_ok = await ac.post("/api/admin/login", json={"username": "Ramesh", "password": "212006"})
        assert resp_ok.status_code == 200
        assert resp_ok.json()["success"] is True
        assert resp_ok.json()["role"] == "owner"
