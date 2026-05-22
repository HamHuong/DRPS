def test_login_success(client):
    response = client.post("/auth/login", json={"username": "testadmin", "password": "adminpass"})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"

def test_login_invalid_password(client):
    response = client.post("/auth/login", json={"username": "testadmin", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Credentials"

def test_login_nonexistent_user(client):
    response = client.post("/auth/login", json={"username": "nobody", "password": "nopassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Credentials"
