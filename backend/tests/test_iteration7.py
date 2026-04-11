"""
Iteration 7 Tests: Client Email/Password Auth, Auto-Account Creation, Pricing Updates
Tests the new auth system replacing Google OAuth with email/password client auth.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"
TEST_CLIENT_EMAIL = "testclient@example.com"
TEST_CLIENT_PASSWORD = "NewPass456"


class TestClientAuth:
    """Client email/password authentication tests"""
    
    def test_client_login_success(self):
        """POST /api/auth/login works with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_CLIENT_EMAIL
        assert "name" in data
        # Verify password_hash is NOT returned
        assert "password_hash" not in data
    
    def test_client_login_invalid_credentials(self):
        """POST /api/auth/login returns 401 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": "WrongPassword123"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Invalid" in data["detail"]
    
    def test_client_login_nonexistent_email(self):
        """POST /api/auth/login returns 401 for non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "anypassword"}
        )
        assert response.status_code == 401
    
    def test_auth_me_with_cookie(self):
        """GET /api/auth/me returns user data when authenticated via cookie"""
        session = requests.Session()
        # Login first
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        assert login_resp.status_code == 200
        
        # Check /auth/me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == TEST_CLIENT_EMAIL
        assert "user_id" in data
    
    def test_auth_me_without_auth(self):
        """GET /api/auth/me returns 401 when not authenticated"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_logout_clears_session(self):
        """POST /api/auth/logout clears session"""
        session = requests.Session()
        # Login
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        
        # Logout
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_resp.status_code == 200
        assert logout_resp.json()["message"] == "Logged out"


class TestPasswordChange:
    """Password change functionality tests"""
    
    def test_change_password_success(self):
        """POST /api/auth/change-password changes password correctly"""
        session = requests.Session()
        # Login
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        
        # Change password
        new_password = "TempPass123"
        change_resp = session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": TEST_CLIENT_PASSWORD, "new_password": new_password}
        )
        assert change_resp.status_code == 200
        assert "Password updated" in change_resp.json()["message"]
        
        # Change it back
        session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": new_password, "new_password": TEST_CLIENT_PASSWORD}
        )
    
    def test_change_password_wrong_current(self):
        """POST /api/auth/change-password fails with wrong current password"""
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        
        change_resp = session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": "WrongCurrent", "new_password": "NewPass123"}
        )
        assert change_resp.status_code == 400
        assert "incorrect" in change_resp.json()["detail"].lower()
    
    def test_change_password_requires_auth(self):
        """POST /api/auth/change-password requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": "any", "new_password": "any"}
        )
        assert response.status_code == 401


class TestProfileUpdate:
    """Profile update functionality tests"""
    
    def test_update_profile_name(self):
        """PUT /api/auth/profile updates client name"""
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD}
        )
        
        new_name = f"Test Client {datetime.now().strftime('%H%M%S')}"
        update_resp = session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": new_name}
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == new_name
        assert "password_hash" not in data
    
    def test_update_profile_requires_auth(self):
        """PUT /api/auth/profile requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": "Test"}
        )
        assert response.status_code == 401


class TestBookingAutoAccount:
    """Booking auto-account creation tests"""
    
    def test_booking_creates_account_for_new_email(self):
        """POST /api/bookings auto-creates client account with account_created=true"""
        unique_email = f"test_auto_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "name": "Auto Test User",
                "email": unique_email,
                "phone": "555-1234",
                "property_address": "123 Test St",
                "property_type": "residential",
                "service_area": "calgary",
                "package_id": "quick_aerial",
                "scheduled_date": "2026-05-01",
                "scheduled_time": "10:00 AM"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account_created"] == True
        assert data["status"] == "pending"
        assert "id" in data
    
    def test_booking_no_duplicate_for_existing_email(self):
        """POST /api/bookings does NOT create duplicate account for existing email"""
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "name": "Test Client",
                "email": TEST_CLIENT_EMAIL,
                "phone": "555-1234",
                "property_address": "456 Existing St",
                "property_type": "residential",
                "service_area": "calgary",
                "package_id": "aerial_plus",
                "scheduled_date": "2026-05-02",
                "scheduled_time": "2:00 PM"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["account_created"] == False


class TestPricingUpdates:
    """Pricing package updates tests"""
    
    def test_quick_aerial_no_video(self):
        """Quick Aerial package has NO video feature listed"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        quick_aerial = next((p for p in packages if p["id"] == "quick_aerial"), None)
        assert quick_aerial is not None
        
        # Check that no video feature is listed
        features_text = " ".join(quick_aerial["features"]).lower()
        assert "video" not in features_text, f"Quick Aerial should NOT have video. Features: {quick_aerial['features']}"
        assert quick_aerial["price"] == 199.0
    
    def test_aerial_plus_has_cinematic_no_fpv(self):
        """Aerial Plus package has cinematic video but NO FPV flythrough"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        aerial_plus = next((p for p in packages if p["id"] == "aerial_plus"), None)
        assert aerial_plus is not None
        
        features_text = " ".join(aerial_plus["features"]).lower()
        # Should have cinematic video
        assert "cinematic" in features_text or "video" in features_text, f"Aerial Plus should have video. Features: {aerial_plus['features']}"
        # Should NOT have FPV flythrough
        assert "fpv" not in features_text and "fly-through" not in features_text, f"Aerial Plus should NOT have FPV. Features: {aerial_plus['features']}"
        assert aerial_plus["price"] == 299.0
    
    def test_fpv_showcase_has_fpv(self):
        """FPV Showcase package has FPV fly-through"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        packages = response.json()
        
        fpv_showcase = next((p for p in packages if p["id"] == "fpv_showcase"), None)
        assert fpv_showcase is not None
        
        features_text = " ".join(fpv_showcase["features"]).lower()
        assert "fpv" in features_text or "fly-through" in features_text
        assert fpv_showcase["price"] == 649.0


class TestFleetUpdate:
    """Fleet/equipment updates tests"""
    
    def test_fleet_has_betafpv_dji_o4_pro(self):
        """Fleet shows BetaFPV Pavo 20 Pro (DJI O4 Pro)"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        
        fleet = data.get("fleet", [])
        fleet_names = [d.get("name", "") for d in fleet]
        
        # Check for BetaFPV with DJI O4 Pro
        betafpv_found = any("BetaFPV" in name and "DJI O4 Pro" in name for name in fleet_names)
        assert betafpv_found, f"Fleet should have 'BetaFPV Pavo 20 Pro (DJI O4 Pro)'. Found: {fleet_names}"


class TestDashboardBranding:
    """Dashboard branding tests"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard redirects to /login if not authenticated (via /api/bookings)"""
        response = requests.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 401


class TestAdminAuth:
    """Admin authentication still works"""
    
    def test_admin_login_works(self):
        """Admin login with valid credentials still works"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
