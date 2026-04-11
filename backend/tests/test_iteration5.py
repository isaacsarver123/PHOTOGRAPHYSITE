"""
Iteration 5 Backend Tests - SkyLine Media
Tests for: New 3-tier pricing, Central Alberta location, admin CMS, packages API, site-content API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"


class TestHealthAndBasic:
    """Basic health and API tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health endpoint returns healthy")
    
    def test_api_root(self):
        """Test API root returns SkyLine Media branding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "SkyLine Media API"
        assert data["currency"] == "CAD"
        print("PASS: API root returns SkyLine Media branding with CAD currency")


class TestNewPricingPackages:
    """Tests for new 3-tier pricing: Quick Aerial $199, Aerial Plus $299, FPV Showcase $649"""
    
    def test_packages_returns_three_tiers(self):
        """Test GET /api/packages returns exactly 3 packages"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        assert len(packages) == 3, f"Expected 3 packages, got {len(packages)}"
        print(f"PASS: GET /api/packages returns {len(packages)} packages")
    
    def test_quick_aerial_package(self):
        """Test Quick Aerial package: $199"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        quick_aerial = next((p for p in packages if p["id"] == "quick_aerial"), None)
        assert quick_aerial is not None, "Quick Aerial package not found"
        assert quick_aerial["name"] == "Quick Aerial"
        assert quick_aerial["price"] == 199.0, f"Expected $199, got ${quick_aerial['price']}"
        assert "8-12 aerial photos" in str(quick_aerial["features"])
        print(f"PASS: Quick Aerial package found with price ${quick_aerial['price']}")
    
    def test_aerial_plus_package(self):
        """Test Aerial Plus package: $299 (popular)"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        aerial_plus = next((p for p in packages if p["id"] == "aerial_plus"), None)
        assert aerial_plus is not None, "Aerial Plus package not found"
        assert aerial_plus["name"] == "Aerial Plus"
        assert aerial_plus["price"] == 299.0, f"Expected $299, got ${aerial_plus['price']}"
        assert aerial_plus.get("popular") == True, "Aerial Plus should be marked as popular"
        print(f"PASS: Aerial Plus package found with price ${aerial_plus['price']} (popular)")
    
    def test_fpv_showcase_package(self):
        """Test FPV Showcase package: $649"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        fpv_showcase = next((p for p in packages if p["id"] == "fpv_showcase"), None)
        assert fpv_showcase is not None, "FPV Showcase package not found"
        assert fpv_showcase["name"] == "FPV Showcase"
        assert fpv_showcase["price"] == 649.0, f"Expected $649, got ${fpv_showcase['price']}"
        assert "Full indoor FPV fly-through" in str(fpv_showcase["features"])
        print(f"PASS: FPV Showcase package found with price ${fpv_showcase['price']}")


class TestSiteContentAPI:
    """Tests for public site-content API"""
    
    def test_site_content_returns_data(self):
        """Test GET /api/site-content returns site content"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        assert "phone" in data
        assert "email" in data
        assert "main_location" in data
        assert "service_areas" in data
        assert "fleet" in data
        print("PASS: GET /api/site-content returns expected fields")
    
    def test_site_content_phone(self):
        """Test site content has correct phone number"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        assert "(825) 962-3425" in data.get("phone", ""), f"Expected phone (825) 962-3425, got {data.get('phone')}"
        print(f"PASS: Site content phone is {data.get('phone')}")
    
    def test_site_content_location(self):
        """Test site content has Central Alberta location"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        assert "Central Alberta" in data.get("main_location", ""), f"Expected Central Alberta, got {data.get('main_location')}"
        print(f"PASS: Site content main_location is {data.get('main_location')}")
    
    def test_site_content_service_areas(self):
        """Test site content has service areas with travel fees"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        service_areas = data.get("service_areas", [])
        assert len(service_areas) >= 3, f"Expected at least 3 service areas, got {len(service_areas)}"
        
        # Check for Central Alberta (no fee)
        central = next((a for a in service_areas if "Central Alberta" in a.get("name", "")), None)
        assert central is not None, "Central Alberta service area not found"
        assert central.get("fee", -1) == 0, f"Central Alberta should have $0 fee, got ${central.get('fee')}"
        
        # Check for Edmonton (+$80)
        edmonton = next((a for a in service_areas if "Edmonton" in a.get("name", "")), None)
        assert edmonton is not None, "Edmonton service area not found"
        assert edmonton.get("fee", -1) == 80, f"Edmonton should have $80 fee, got ${edmonton.get('fee')}"
        
        # Check for Calgary (+$80)
        calgary = next((a for a in service_areas if "Calgary" in a.get("name", "")), None)
        assert calgary is not None, "Calgary service area not found"
        assert calgary.get("fee", -1) == 80, f"Calgary should have $80 fee, got ${calgary.get('fee')}"
        
        print("PASS: Service areas include Central Alberta ($0), Edmonton (+$80), Calgary (+$80)")
    
    def test_site_content_fleet(self):
        """Test site content has fleet with 4 drones including Pavo 20 Pro"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        fleet = data.get("fleet", [])
        assert len(fleet) >= 4, f"Expected at least 4 drones in fleet, got {len(fleet)}"
        
        fleet_names = [d.get("name", "") for d in fleet]
        assert any("Mavic 3 Pro" in name for name in fleet_names), "Mavic 3 Pro not in fleet"
        assert any("Air 3" in name for name in fleet_names), "Air 3 not in fleet"
        assert any("Avata 2" in name for name in fleet_names), "Avata 2 not in fleet"
        assert any("Pavo 20 Pro" in name for name in fleet_names), "Pavo 20 Pro not in fleet"
        
        print(f"PASS: Fleet includes all 4 drones: {fleet_names}")


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
        print(f"PASS: Admin login successful for {ADMIN_EMAIL}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Admin login rejects invalid credentials")


class TestAdminSiteContent:
    """Admin site content CMS tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_admin_site_content_requires_auth(self):
        """Test GET /api/admin/site-content requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/site-content")
        assert response.status_code == 401
        print("PASS: GET /api/admin/site-content requires authentication")
    
    def test_admin_site_content_returns_data(self, admin_token):
        """Test GET /api/admin/site-content returns site content"""
        response = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "phone" in data
        assert "email" in data
        assert "main_location" in data
        assert "service_areas" in data
        assert "fleet" in data
        print("PASS: GET /api/admin/site-content returns expected fields")
    
    def test_admin_site_content_update(self, admin_token):
        """Test PUT /api/admin/site-content saves data"""
        # First get current content
        get_response = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        current_data = get_response.json()
        
        # Update with same data (to not break anything)
        update_data = {
            "phone": current_data.get("phone", "(825) 962-3425"),
            "email": current_data.get("email", "info@skylinemedia.ca"),
            "main_location": current_data.get("main_location", "Central Alberta"),
            "service_areas": current_data.get("service_areas", []),
            "travel_fee_note": current_data.get("travel_fee_note", ""),
            "fleet": current_data.get("fleet", [])
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/site-content",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Site content updated"
        print("PASS: PUT /api/admin/site-content saves data successfully")


class TestAdminPackages:
    """Admin packages CMS tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_admin_packages_requires_auth(self):
        """Test GET /api/admin/packages requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/packages")
        assert response.status_code == 401
        print("PASS: GET /api/admin/packages requires authentication")
    
    def test_admin_packages_returns_list(self, admin_token):
        """Test GET /api/admin/packages returns package list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        packages = response.json()
        assert isinstance(packages, list)
        assert len(packages) == 3
        print(f"PASS: GET /api/admin/packages returns {len(packages)} packages")
    
    def test_admin_packages_update(self, admin_token):
        """Test PUT /api/admin/packages saves packages"""
        # First get current packages
        get_response = requests.get(
            f"{BASE_URL}/api/admin/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        current_packages = get_response.json()
        
        # Update with same data (to not break anything)
        response = requests.put(
            f"{BASE_URL}/api/admin/packages",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"packages": current_packages}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Packages updated"
        print("PASS: PUT /api/admin/packages saves packages successfully")


class TestAdminSettings:
    """Admin settings tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_admin_settings_requires_auth(self):
        """Test GET /api/admin/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
        print("PASS: GET /api/admin/settings requires authentication")
    
    def test_admin_settings_returns_smtp_fields(self, admin_token):
        """Test GET /api/admin/settings returns SMTP configuration fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "smtp_host" in data
        assert "smtp_port" in data
        assert "smtp_user" in data
        assert "sender_email" in data
        assert "photo_retention_days" in data
        print("PASS: GET /api/admin/settings returns SMTP configuration fields")


class TestAdminDashboard:
    """Admin dashboard stats tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_admin_stats(self, admin_token):
        """Test GET /api/admin/stats returns dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_bookings" in data
        assert "pending_bookings" in data
        assert "total_clients" in data
        assert "total_contacts" in data
        assert "total_revenue" in data
        assert data.get("currency") == "CAD"
        print("PASS: GET /api/admin/stats returns dashboard stats with CAD currency")
    
    def test_admin_bookings(self, admin_token):
        """Test GET /api/admin/bookings returns booking list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/admin/bookings returns {len(data)} bookings")
    
    def test_admin_clients(self, admin_token):
        """Test GET /api/admin/clients returns client list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/admin/clients returns {len(data)} clients")
    
    def test_admin_contacts(self, admin_token):
        """Test GET /api/admin/contacts returns contact list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/contacts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/admin/contacts returns {len(data)} contacts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
