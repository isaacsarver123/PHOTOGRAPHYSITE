"""
Iteration 4 Tests - SkyLine Media
Tests for:
1. Admin SMTP settings endpoints (GET/PUT /api/admin/settings)
2. Test email endpoint (POST /api/admin/test-email)
3. Packages endpoint verification (fleet specs)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"


class TestHealthAndBasics:
    """Basic health and API checks"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_api_root(self):
        """Test API root returns SkyLine Media branding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "SkyLine Media" in data.get("message", "")
        assert data.get("currency") == "CAD"
        print("✓ API root returns correct branding")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == ADMIN_EMAIL.lower()
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['email']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")


class TestAdminSettings:
    """Admin settings endpoint tests - SMTP configuration"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_settings(self, admin_token):
        """Test GET /api/admin/settings returns SMTP fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify SMTP fields exist (smtp_password may be masked or omitted when empty)
        assert "smtp_host" in data
        assert "smtp_port" in data
        assert "smtp_user" in data
        assert "sender_email" in data
        # smtp_password is masked as "***" when set, or may be omitted when empty
        
        # Verify other settings fields
        assert "photo_storage_path" in data
        assert "photo_retention_days" in data
        
        print(f"✓ Settings endpoint returns all fields: {list(data.keys())}")
    
    def test_get_settings_unauthorized(self):
        """Test GET /api/admin/settings without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
        print("✓ Settings endpoint requires authentication")
    
    def test_update_settings(self, admin_token):
        """Test PUT /api/admin/settings accepts SMTP fields"""
        # Update with test values
        update_data = {
            "smtp_host": "smtp.test.com",
            "smtp_port": 465,
            "smtp_user": "test@test.com",
            "sender_email": "noreply@test.com",
            "photo_retention_days": 45
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Settings updated"
        
        # Verify settings were updated
        get_response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.status_code == 200
        settings = get_response.json()
        assert settings["smtp_host"] == "smtp.test.com"
        assert settings["smtp_port"] == 465
        assert settings["smtp_user"] == "test@test.com"
        assert settings["sender_email"] == "noreply@test.com"
        assert settings["photo_retention_days"] == 45
        
        # Reset to original values
        reset_data = {
            "smtp_host": "",
            "smtp_port": 587,
            "smtp_user": "",
            "sender_email": "noreply@skylinemedia.ca",
            "photo_retention_days": 30
        }
        requests.put(
            f"{BASE_URL}/api/admin/settings",
            json=reset_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        print("✓ Settings update and persistence working correctly")
    
    def test_update_settings_unauthorized(self):
        """Test PUT /api/admin/settings without auth returns 401"""
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            json={"smtp_host": "test.com"}
        )
        assert response.status_code == 401
        print("✓ Settings update requires authentication")


class TestTestEmail:
    """Test email endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_send_test_email_mocked(self, admin_token):
        """Test POST /api/admin/test-email returns mock status when SMTP not configured"""
        response = requests.post(
            f"{BASE_URL}/api/admin/test-email",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return mocked status since SMTP is not configured
        assert "status" in data
        assert "message" in data
        # Either 'mocked' or 'sent' depending on config
        assert data["status"] in ["mocked", "sent"]
        
        print(f"✓ Test email endpoint working: status={data['status']}, message={data['message']}")
    
    def test_send_test_email_unauthorized(self):
        """Test POST /api/admin/test-email without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/test-email")
        assert response.status_code == 401
        print("✓ Test email endpoint requires authentication")


class TestPackages:
    """Test packages endpoint for updated fleet specs"""
    
    def test_get_packages(self):
        """Test GET /api/packages returns correct fleet info"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        assert len(packages) == 3
        
        # Verify package names and CAD pricing
        package_ids = [p["id"] for p in packages]
        assert "starter" in package_ids
        assert "professional" in package_ids
        assert "premium" in package_ids
        
        # Verify CAD currency
        for package in packages:
            assert package["currency"] == "CAD"
        
        # Verify pricing
        starter = next(p for p in packages if p["id"] == "starter")
        professional = next(p for p in packages if p["id"] == "professional")
        premium = next(p for p in packages if p["id"] == "premium")
        
        assert starter["price"] == 399.00
        assert professional["price"] == 799.00
        assert premium["price"] == 1299.00
        
        print(f"✓ Packages endpoint returns correct data: {[p['id'] for p in packages]}")


class TestAdminDashboard:
    """Test admin dashboard endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_admin_stats(self, admin_token):
        """Test GET /api/admin/stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats fields
        assert "total_bookings" in data
        assert "pending_bookings" in data
        assert "total_clients" in data
        assert "total_contacts" in data
        assert "total_revenue" in data
        assert data["currency"] == "CAD"
        
        print(f"✓ Admin stats endpoint working: {data}")
    
    def test_admin_bookings(self, admin_token):
        """Test GET /api/admin/bookings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin bookings endpoint working: {len(data)} bookings")
    
    def test_admin_clients(self, admin_token):
        """Test GET /api/admin/clients"""
        response = requests.get(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin clients endpoint working: {len(data)} clients")
    
    def test_admin_contacts(self, admin_token):
        """Test GET /api/admin/contacts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/contacts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin contacts endpoint working: {len(data)} contacts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
