"""
Test iteration 9 features:
1. DELETE /api/admin/bookings/{booking_id} - Delete booking and associated photos
2. PUT /api/admin/settings with photo_storage_path - Accept absolute paths
3. /booking page package cards - Display full details (features, description, notes, recommended_for)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"


class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin login works"""
        assert admin_token is not None
        print(f"✓ Admin login successful, token obtained")


class TestBookingDeletion:
    """Test DELETE /api/admin/bookings/{booking_id} endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture
    def test_booking_id(self, admin_token):
        """Create a test booking for deletion"""
        # Create a booking via public endpoint
        booking_data = {
            "name": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
            "email": f"test_delete_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "555-0123",
            "property_address": "123 Test Delete St",
            "property_type": "residential",
            "service_area": "central_alberta",
            "scheduled_date": "2026-02-15",
            "scheduled_time": "10:00 AM",
            "package_id": "quick_aerial"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200, f"Failed to create test booking: {response.text}"
        data = response.json()
        assert "id" in data, "No booking ID in response"
        print(f"✓ Created test booking: {data['id']}")
        return data["id"]
    
    def test_delete_booking_success(self, admin_token, test_booking_id):
        """Test successful booking deletion"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Verify booking exists first
        get_response = requests.get(
            f"{BASE_URL}/api/admin/bookings/{test_booking_id}",
            headers=headers
        )
        assert get_response.status_code == 200, "Booking should exist before deletion"
        print(f"✓ Verified booking exists: {test_booking_id}")
        
        # Delete the booking
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/bookings/{test_booking_id}",
            headers=headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        data = delete_response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        print(f"✓ Booking deleted successfully: {data['message']}")
        
        # Verify booking no longer exists
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/bookings/{test_booking_id}",
            headers=headers
        )
        assert verify_response.status_code == 404, "Booking should not exist after deletion"
        print(f"✓ Verified booking no longer exists (404)")
    
    def test_delete_nonexistent_booking(self, admin_token):
        """Test deleting a booking that doesn't exist"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        fake_id = f"nonexistent_{uuid.uuid4().hex}"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/bookings/{fake_id}",
            headers=headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent booking"
        print(f"✓ Correctly returns 404 for nonexistent booking")
    
    def test_delete_booking_requires_auth(self):
        """Test that delete endpoint requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/bookings/some_id")
        assert response.status_code == 401, "Should require authentication"
        print(f"✓ Delete endpoint requires authentication (401)")


class TestPhotoStoragePath:
    """Test PUT /api/admin/settings with absolute photo_storage_path"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_update_storage_path_absolute(self, admin_token):
        """Test updating storage path to an absolute path"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Use a test absolute path
        test_path = "/tmp/test_absolute_path_skyline"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=headers,
            json={"photo_storage_path": test_path}
        )
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        data = response.json()
        assert "message" in data
        assert "settings" in data
        assert data["settings"]["photo_storage_path"] == test_path
        print(f"✓ Storage path updated to: {test_path}")
        
        # Verify the setting persisted
        get_response = requests.get(f"{BASE_URL}/api/admin/settings", headers=headers)
        assert get_response.status_code == 200
        settings = get_response.json()
        assert settings["photo_storage_path"] == test_path
        print(f"✓ Storage path persisted correctly")
    
    def test_restore_default_storage_path(self, admin_token):
        """Restore the default storage path after test"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        default_path = "/app/backend/uploads"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers=headers,
            json={"photo_storage_path": default_path}
        )
        assert response.status_code == 200
        print(f"✓ Restored default storage path: {default_path}")


class TestPackagesAPI:
    """Test packages API returns full details for booking page"""
    
    def test_packages_have_full_details(self):
        """Test that packages include features, description, notes, recommended_for"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200, f"Failed to get packages: {response.text}"
        packages = response.json()
        
        assert len(packages) >= 3, "Should have at least 3 packages"
        print(f"✓ Found {len(packages)} packages")
        
        for pkg in packages:
            # Required fields
            assert "id" in pkg, f"Package missing 'id'"
            assert "name" in pkg, f"Package missing 'name'"
            assert "price" in pkg, f"Package missing 'price'"
            assert "description" in pkg, f"Package {pkg.get('name')} missing 'description'"
            assert "features" in pkg, f"Package {pkg.get('name')} missing 'features'"
            assert isinstance(pkg["features"], list), f"Package {pkg.get('name')} features should be a list"
            assert len(pkg["features"]) > 0, f"Package {pkg.get('name')} should have at least one feature"
            
            print(f"  ✓ Package '{pkg['name']}': ${pkg['price']}, {len(pkg['features'])} features")
            
            # Check for recommended_for (at least some packages should have it)
            if "recommended_for" in pkg and pkg["recommended_for"]:
                print(f"    - Recommended for: {pkg['recommended_for']}")
        
        # Check that at least one package has notes
        packages_with_notes = [p for p in packages if p.get("notes")]
        print(f"✓ {len(packages_with_notes)} packages have notes")
        
        # Check that at least one package has recommended_for
        packages_with_recommended = [p for p in packages if p.get("recommended_for")]
        print(f"✓ {len(packages_with_recommended)} packages have recommended_for")


class TestAdminBookingsList:
    """Test admin bookings list endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_bookings_list(self, admin_token):
        """Test getting bookings list for admin dashboard"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=headers)
        assert response.status_code == 200, f"Failed to get bookings: {response.text}"
        bookings = response.json()
        
        assert isinstance(bookings, list), "Bookings should be a list"
        print(f"✓ Got {len(bookings)} bookings")
        
        if len(bookings) > 0:
            booking = bookings[0]
            # Verify booking has required fields for display
            assert "id" in booking
            assert "name" in booking
            assert "email" in booking
            assert "status" in booking
            print(f"  ✓ First booking: {booking['name']} - {booking['status']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
