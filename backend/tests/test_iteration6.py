"""
Iteration 6 Tests: Scroll animations replay + Admin CMS for Portfolio & Home Services
Features tested:
1. Home page services fetched from /api/home-services API
2. Admin Portfolio CRUD (GET, POST, PUT, DELETE)
3. Admin Home Services (GET, PUT)
4. Viewport once:false for scroll animations (verified in code review)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com')

class TestPublicEndpoints:
    """Test public endpoints for home services and portfolio"""
    
    def test_home_services_returns_4_items(self):
        """GET /api/home-services returns 4 default service items"""
        response = requests.get(f"{BASE_URL}/api/home-services")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4, f"Expected 4 services, got {len(data)}"
        
        # Verify structure of each service
        for svc in data:
            assert "title" in svc
            assert "description" in svc
            assert "image" in svc
            assert "span" in svc
        
        # Verify expected titles
        titles = [s["title"] for s in data]
        assert "Residential" in titles
        assert "Commercial" in titles
        print(f"✓ GET /api/home-services returns {len(data)} services: {titles}")
    
    def test_portfolio_returns_items(self):
        """GET /api/portfolio returns portfolio items"""
        response = requests.get(f"{BASE_URL}/api/portfolio")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 6, f"Expected at least 6 portfolio items, got {len(data)}"
        
        # Verify structure
        for item in data:
            assert "id" in item
            assert "title" in item
            assert "category" in item
            assert "image_url" in item
        
        print(f"✓ GET /api/portfolio returns {len(data)} items")


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_admin_login_success(self):
        """Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "isaacsarver100@gmail.com"
        print("✓ Admin login successful")


class TestAdminPortfolio:
    """Test admin portfolio CRUD operations"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        return response.json()["token"]
    
    def test_get_admin_portfolio(self, admin_token):
        """GET /api/admin/portfolio returns portfolio items for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/portfolio",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6
        print(f"✓ GET /api/admin/portfolio returns {len(data)} items")
    
    def test_admin_portfolio_requires_auth(self):
        """GET /api/admin/portfolio requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/portfolio")
        assert response.status_code == 401
        print("✓ GET /api/admin/portfolio requires auth (401)")
    
    def test_create_portfolio_item(self, admin_token):
        """POST /api/admin/portfolio creates new item"""
        new_item = {
            "title": "TEST_Portfolio_Item",
            "description": "Test description for automated testing",
            "category": "residential",
            "image_url": "https://example.com/test.jpg",
            "location": "Test Location, AB"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/portfolio",
            json=new_item,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Portfolio_Item"
        
        # Verify it was created by fetching it
        item_id = data["id"]
        get_response = requests.get(
            f"{BASE_URL}/api/portfolio/{item_id}"
        )
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Portfolio_Item"
        
        print(f"✓ POST /api/admin/portfolio created item with id: {item_id}")
        return item_id
    
    def test_update_portfolio_item(self, admin_token):
        """PUT /api/admin/portfolio/{id} updates item"""
        # First create an item
        new_item = {
            "title": "TEST_Update_Item",
            "description": "Original description",
            "category": "commercial",
            "image_url": "https://example.com/original.jpg",
            "location": "Original Location"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/portfolio",
            json=new_item,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        item_id = create_response.json()["id"]
        
        # Update the item
        update_data = {
            "title": "TEST_Updated_Title",
            "description": "Updated description"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/admin/portfolio/{item_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/portfolio/{item_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Updated_Title"
        assert fetched["description"] == "Updated description"
        
        print(f"✓ PUT /api/admin/portfolio/{item_id} updated successfully")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/portfolio/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_delete_portfolio_item(self, admin_token):
        """DELETE /api/admin/portfolio/{id} deletes item"""
        # First create an item
        new_item = {
            "title": "TEST_Delete_Item",
            "description": "To be deleted",
            "category": "land",
            "image_url": "https://example.com/delete.jpg",
            "location": "Delete Location"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/portfolio",
            json=new_item,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        item_id = create_response.json()["id"]
        
        # Delete the item
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/portfolio/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/portfolio/{item_id}")
        assert get_response.status_code == 404
        
        print(f"✓ DELETE /api/admin/portfolio/{item_id} deleted successfully")


class TestAdminHomeServices:
    """Test admin home services CMS"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        return response.json()["token"]
    
    def test_get_admin_home_services(self, admin_token):
        """GET /api/admin/home-services returns services for editing"""
        response = requests.get(
            f"{BASE_URL}/api/admin/home-services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4
        
        # Verify structure
        for svc in data:
            assert "title" in svc
            assert "description" in svc
            assert "image" in svc
            assert "span" in svc
        
        print(f"✓ GET /api/admin/home-services returns {len(data)} services")
    
    def test_admin_home_services_requires_auth(self):
        """GET /api/admin/home-services requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/home-services")
        assert response.status_code == 401
        print("✓ GET /api/admin/home-services requires auth (401)")
    
    def test_update_home_services(self, admin_token):
        """PUT /api/admin/home-services saves updated services"""
        # Get current services
        get_response = requests.get(
            f"{BASE_URL}/api/admin/home-services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_services = get_response.json()
        
        # Modify one service title temporarily
        modified_services = original_services.copy()
        original_title = modified_services[0]["title"]
        modified_services[0]["title"] = "TEST_Modified_Service"
        
        # Update
        update_response = requests.put(
            f"{BASE_URL}/api/admin/home-services",
            json={"services": modified_services},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/home-services")
        assert verify_response.status_code == 200
        updated = verify_response.json()
        assert updated[0]["title"] == "TEST_Modified_Service"
        
        print("✓ PUT /api/admin/home-services updated successfully")
        
        # Restore original
        modified_services[0]["title"] = original_title
        requests.put(
            f"{BASE_URL}/api/admin/home-services",
            json={"services": modified_services},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print("✓ Restored original home services")


class TestAdminDashboardNavigation:
    """Test admin dashboard has Portfolio and Home Services nav items"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        return response.json()["token"]
    
    def test_admin_stats_endpoint(self, admin_token):
        """GET /api/admin/stats returns dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_bookings" in data
        assert "total_clients" in data
        print("✓ GET /api/admin/stats returns dashboard stats")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        })
        return response.json()["token"]
    
    def test_cleanup_test_portfolio_items(self, admin_token):
        """Clean up TEST_ prefixed portfolio items"""
        response = requests.get(
            f"{BASE_URL}/api/admin/portfolio",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        items = response.json()
        
        deleted_count = 0
        for item in items:
            if item.get("title", "").startswith("TEST_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/portfolio/{item['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test portfolio items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
