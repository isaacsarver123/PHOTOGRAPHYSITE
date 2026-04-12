"""
Post-Refactoring Regression Tests for SkyLine Media
Tests all endpoints after backend split from single server.py into modular files
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"
CLIENT_EMAIL = "testclient@example.com"
CLIENT_PASSWORD = "NewPass456"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Headers with admin auth"""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ==================== HEALTH & PUBLIC ENDPOINTS ====================

class TestHealthAndPublic:
    """Test public endpoints from routes/public.py"""
    
    def test_health_endpoint(self, api_client):
        """GET /api/health should return healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self, api_client):
        """GET /api/ should return API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "SkyLine Media" in data.get("message", "")
        print("✓ Root endpoint working")
    
    def test_packages_endpoint(self, api_client):
        """GET /api/packages should return 3 packages with features"""
        response = api_client.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        assert isinstance(packages, list)
        assert len(packages) >= 3, f"Expected at least 3 packages, got {len(packages)}"
        
        # Verify package structure
        for pkg in packages:
            assert "id" in pkg
            assert "name" in pkg
            assert "price" in pkg
            assert "features" in pkg
            assert isinstance(pkg["features"], list)
            assert len(pkg["features"]) > 0
        print(f"✓ Packages endpoint returns {len(packages)} packages with features")
    
    def test_single_package_endpoint(self, api_client):
        """GET /api/packages/{id} should return specific package"""
        response = api_client.get(f"{BASE_URL}/api/packages/quick_aerial")
        assert response.status_code == 200
        pkg = response.json()
        assert pkg["id"] == "quick_aerial"
        assert "features" in pkg
        print("✓ Single package endpoint working")


# ==================== CMS ENDPOINTS ====================

class TestCMSEndpoints:
    """Test CMS endpoints from routes/admin_cms.py"""
    
    def test_cms_hero(self, api_client):
        """GET /api/cms/hero should return hero content"""
        response = api_client.get(f"{BASE_URL}/api/cms/hero")
        assert response.status_code == 200
        data = response.json()
        assert "headline" in data or "cta_text" in data
        print("✓ CMS hero endpoint working")
    
    def test_cms_stats(self, api_client):
        """GET /api/cms/stats should return stats content"""
        response = api_client.get(f"{BASE_URL}/api/cms/stats")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ CMS stats endpoint returns {len(data)} stats")
    
    def test_cms_about(self, api_client):
        """GET /api/cms/about should return about content"""
        response = api_client.get(f"{BASE_URL}/api/cms/about")
        assert response.status_code == 200
        data = response.json()
        assert "headline" in data or "description" in data
        print("✓ CMS about endpoint working")
    
    def test_cms_faq(self, api_client):
        """GET /api/cms/faq should return FAQ content"""
        response = api_client.get(f"{BASE_URL}/api/cms/faq")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ CMS FAQ endpoint returns {len(data)} items")
    
    def test_site_content(self, api_client):
        """GET /api/site-content should return site content"""
        response = api_client.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        assert "phone" in data or "email" in data
        print("✓ Site content endpoint working")
    
    def test_home_services(self, api_client):
        """GET /api/home-services should return home services"""
        response = api_client.get(f"{BASE_URL}/api/home-services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Home services endpoint returns {len(data)} services")


# ==================== ADMIN AUTH ENDPOINTS ====================

class TestAdminAuth:
    """Test admin auth endpoints from routes/admin_auth.py"""
    
    def test_admin_login_success(self, api_client):
        """POST /api/admin/login should work with admin credentials"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "email" in data
        assert data["email"] == ADMIN_EMAIL.lower()
        assert data["role"] == "admin"
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """POST /api/admin/login should reject invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin login rejects invalid credentials")
    
    def test_admin_me_endpoint(self, api_client, admin_headers):
        """GET /api/admin/me should return admin info"""
        response = api_client.get(f"{BASE_URL}/api/admin/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["role"] == "admin"
        print("✓ Admin /me endpoint working")
    
    def test_admin_stats(self, api_client, admin_headers):
        """GET /api/admin/stats should return dashboard stats"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_bookings" in data
        assert "total_clients" in data
        assert "total_revenue" in data
        print("✓ Admin stats endpoint working")


# ==================== ADMIN BOOKINGS ENDPOINTS ====================

class TestAdminBookings:
    """Test admin booking endpoints from routes/admin_bookings.py"""
    
    def test_get_admin_bookings(self, api_client, admin_headers):
        """GET /api/admin/bookings should return bookings list"""
        response = api_client.get(f"{BASE_URL}/api/admin/bookings", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin bookings endpoint returns {len(data)} bookings")
    
    def test_get_admin_bookings_with_filter(self, api_client, admin_headers):
        """GET /api/admin/bookings?status=pending should filter bookings"""
        response = api_client.get(f"{BASE_URL}/api/admin/bookings?status=pending", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned bookings should have pending status
        for booking in data:
            assert booking.get("status") == "pending"
        print(f"✓ Admin bookings filter working ({len(data)} pending)")
    
    def test_admin_bookings_requires_auth(self, api_client):
        """GET /api/admin/bookings should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/bookings")
        assert response.status_code == 401
        print("✓ Admin bookings requires authentication")


# ==================== ADMIN SETTINGS ENDPOINTS ====================

class TestAdminSettings:
    """Test admin settings endpoints from routes/admin_auth.py"""
    
    def test_get_admin_settings(self, api_client, admin_headers):
        """GET /api/admin/settings should return settings"""
        response = api_client.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "photo_storage_path" in data
        assert "photo_retention_days" in data
        print("✓ Admin settings endpoint working")
    
    def test_update_admin_settings_absolute_path(self, api_client, admin_headers):
        """PUT /api/admin/settings should accept absolute storage paths"""
        test_path = f"/tmp/test_skyline_storage_{uuid.uuid4().hex[:8]}"
        response = api_client.put(f"{BASE_URL}/api/admin/settings", 
            headers=admin_headers,
            json={"photo_storage_path": test_path}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Admin settings accepts absolute paths")
    
    def test_admin_settings_requires_auth(self, api_client):
        """GET /api/admin/settings should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
        print("✓ Admin settings requires authentication")


# ==================== ADMIN CLIENTS ENDPOINTS ====================

class TestAdminClients:
    """Test admin client endpoints from routes/admin_auth.py"""
    
    def test_get_admin_clients(self, api_client, admin_headers):
        """GET /api/admin/clients should return clients list"""
        response = api_client.get(f"{BASE_URL}/api/admin/clients", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin clients endpoint returns {len(data)} clients")


# ==================== ADMIN CONTACTS ENDPOINTS ====================

class TestAdminContacts:
    """Test admin contact endpoints from routes/admin_auth.py"""
    
    def test_get_admin_contacts(self, api_client, admin_headers):
        """GET /api/admin/contacts should return contacts list"""
        response = api_client.get(f"{BASE_URL}/api/admin/contacts", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin contacts endpoint returns {len(data)} contacts")


# ==================== CLIENT AUTH ENDPOINTS ====================

class TestClientAuth:
    """Test client auth endpoints from routes/client.py"""
    
    def test_client_login_success(self, api_client):
        """POST /api/auth/login should work for client login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        # Client may or may not exist
        if response.status_code == 200:
            data = response.json()
            assert "email" in data
            assert data["email"] == CLIENT_EMAIL.lower()
            print("✓ Client login successful")
        elif response.status_code == 401:
            print("⚠ Client account may not exist yet (expected for fresh DB)")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_client_login_invalid_credentials(self, api_client):
        """POST /api/auth/login should reject invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Client login rejects invalid credentials")


# ==================== BOOKING CREATION ENDPOINTS ====================

class TestBookingCreation:
    """Test booking creation from routes/public.py"""
    
    def test_create_booking_and_auto_create_client(self, api_client, admin_headers):
        """POST /api/bookings should create a booking and auto-create client account"""
        unique_email = f"test_booking_{uuid.uuid4().hex[:8]}@example.com"
        booking_data = {
            "name": "Test Booking User",
            "email": unique_email,
            "phone": "555-123-4567",
            "property_address": "123 Test Street, Calgary, AB",
            "property_type": "residential",
            "service_area": "calgary",
            "package_id": "quick_aerial",
            "scheduled_date": "2026-02-15",
            "scheduled_time": "10:00 AM",
            "notes": "Test booking for regression testing"
        }
        
        response = api_client.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["status"] == "pending"
        assert "total_amount" in data
        assert data.get("account_created") == True  # Auto-created client account
        
        booking_id = data["id"]
        print(f"✓ Booking created with ID: {booking_id}")
        print(f"✓ Client account auto-created: {data.get('account_created')}")
        
        # Cleanup: Delete the test booking
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/bookings/{booking_id}",
            headers=admin_headers
        )
        if delete_response.status_code == 200:
            print(f"✓ Test booking cleaned up")


# ==================== BOOKING DELETION ENDPOINTS ====================

class TestBookingDeletion:
    """Test booking deletion from routes/admin_bookings.py"""
    
    def test_delete_booking_flow(self, api_client, admin_headers):
        """DELETE /api/admin/bookings/{id} should delete booking"""
        # First create a booking to delete
        unique_email = f"test_delete_{uuid.uuid4().hex[:8]}@example.com"
        booking_data = {
            "name": "Delete Test User",
            "email": unique_email,
            "phone": "555-999-8888",
            "property_address": "999 Delete Street, Calgary, AB",
            "property_type": "residential",
            "service_area": "calgary",
            "package_id": "quick_aerial",
            "scheduled_date": "2026-03-01",
            "scheduled_time": "2:00 PM",
            "notes": "Test booking for deletion"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert create_response.status_code == 200
        booking_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/bookings/{booking_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert "deleted" in data.get("message", "").lower()
        print(f"✓ Booking {booking_id} deleted successfully")
        
        # Verify it's gone
        get_response = api_client.get(
            f"{BASE_URL}/api/admin/bookings/{booking_id}",
            headers=admin_headers
        )
        assert get_response.status_code == 404
        print("✓ Deleted booking returns 404")
    
    def test_delete_nonexistent_booking(self, api_client, admin_headers):
        """DELETE /api/admin/bookings/{id} should return 404 for nonexistent"""
        fake_id = f"nonexistent_{uuid.uuid4().hex}"
        response = api_client.delete(
            f"{BASE_URL}/api/admin/bookings/{fake_id}",
            headers=admin_headers
        )
        assert response.status_code == 404
        print("✓ Delete nonexistent booking returns 404")


# ==================== ADMIN CMS ENDPOINTS ====================

class TestAdminCMS:
    """Test admin CMS endpoints from routes/admin_cms.py"""
    
    def test_admin_cms_get_hero(self, api_client, admin_headers):
        """GET /api/admin/cms/hero should return hero content"""
        response = api_client.get(f"{BASE_URL}/api/admin/cms/hero", headers=admin_headers)
        assert response.status_code == 200
        print("✓ Admin CMS hero endpoint working")
    
    def test_admin_packages_get(self, api_client, admin_headers):
        """GET /api/admin/packages should return packages"""
        response = api_client.get(f"{BASE_URL}/api/admin/packages", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin packages endpoint returns {len(data)} packages")
    
    def test_admin_portfolio_get(self, api_client, admin_headers):
        """GET /api/admin/portfolio should return portfolio items"""
        response = api_client.get(f"{BASE_URL}/api/admin/portfolio", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin portfolio endpoint returns {len(data)} items")


# ==================== PORTFOLIO ENDPOINTS ====================

class TestPortfolio:
    """Test portfolio endpoints from routes/public.py"""
    
    def test_get_portfolio(self, api_client):
        """GET /api/portfolio should return portfolio items"""
        response = api_client.get(f"{BASE_URL}/api/portfolio")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Portfolio endpoint returns {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
