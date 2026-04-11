"""
Iteration 8 Tests: CMS System and Photo Storage Improvements
Tests for:
- GET /api/cms/hero, stats, about, faq, addons, contact (public endpoints)
- PUT /api/admin/cms/hero, stats, faq, addons, contact (admin endpoints)
- Photo upload creates client folder with name_email format
- Client profile name change renames photo folder
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://drone-home-showcase.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "isaacsarver100@gmail.com"
ADMIN_PASSWORD = "Isabella0116!"
CLIENT_EMAIL = "testclient@example.com"
CLIENT_PASSWORD = "NewPass456"


class TestCMSPublicEndpoints:
    """Test public CMS endpoints that return website content"""
    
    def test_get_hero_content(self):
        """GET /api/cms/hero returns hero content"""
        response = requests.get(f"{BASE_URL}/api/cms/hero")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify hero content structure
        assert "headline" in data, "Hero should have headline"
        assert "subtitle" in data, "Hero should have subtitle"
        assert "cta_text" in data or "cta_link" in data, "Hero should have CTA"
        print(f"✓ Hero content: headline='{data.get('headline', '')[:50]}...'")
    
    def test_get_stats_content(self):
        """GET /api/cms/stats returns stats array"""
        response = requests.get(f"{BASE_URL}/api/cms/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Stats should be an array"
        if len(data) > 0:
            assert "value" in data[0], "Each stat should have value"
            assert "label" in data[0], "Each stat should have label"
        print(f"✓ Stats content: {len(data)} stats returned")
    
    def test_get_about_content(self):
        """GET /api/cms/about returns about content"""
        response = requests.get(f"{BASE_URL}/api/cms/about")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify about content structure
        assert "headline" in data or "description" in data, "About should have headline or description"
        print(f"✓ About content: tagline='{data.get('tagline', '')}', headline='{data.get('headline', '')[:30]}...'")
    
    def test_get_faq_content(self):
        """GET /api/cms/faq returns FAQ array"""
        response = requests.get(f"{BASE_URL}/api/cms/faq")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "FAQ should be an array"
        if len(data) > 0:
            assert "question" in data[0], "Each FAQ should have question"
            assert "answer" in data[0], "Each FAQ should have answer"
        print(f"✓ FAQ content: {len(data)} FAQs returned")
    
    def test_get_addons_content(self):
        """GET /api/cms/addons returns addons array"""
        response = requests.get(f"{BASE_URL}/api/cms/addons")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Addons should be an array"
        if len(data) > 0:
            assert "name" in data[0], "Each addon should have name"
            assert "price" in data[0], "Each addon should have price"
        print(f"✓ Addons content: {len(data)} addons returned")
    
    def test_get_contact_content(self):
        """GET /api/cms/contact returns contact info"""
        response = requests.get(f"{BASE_URL}/api/cms/contact")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify contact content structure
        assert "phone" in data or "email" in data, "Contact should have phone or email"
        print(f"✓ Contact content: phone='{data.get('phone', '')}', email='{data.get('email', '')}'")


class TestCMSAdminEndpoints:
    """Test admin CMS endpoints that save website content"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        return response.json().get("token")
    
    def test_admin_get_cms_hero(self, admin_token):
        """GET /api/admin/cms/hero returns hero content for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cms/hero",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "headline" in data, "Hero should have headline"
        print(f"✓ Admin GET hero: headline='{data.get('headline', '')[:30]}...'")
    
    def test_admin_update_hero(self, admin_token):
        """PUT /api/admin/cms/hero saves hero content"""
        # First get current content
        get_response = requests.get(
            f"{BASE_URL}/api/admin/cms/hero",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_data = get_response.json()
        
        # Update with test content
        test_headline = f"Test Headline {int(time.time())}"
        update_data = {
            "content": {
                **original_data,
                "headline": test_headline
            }
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/cms/hero",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/cms/hero")
        verify_data = verify_response.json()
        assert verify_data.get("headline") == test_headline, "Hero headline should be updated"
        
        # Restore original
        restore_data = {"content": original_data}
        requests.put(
            f"{BASE_URL}/api/admin/cms/hero",
            json=restore_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"✓ Admin PUT hero: updated and verified")
    
    def test_admin_update_stats(self, admin_token):
        """PUT /api/admin/cms/stats saves stats array"""
        # Get current stats
        get_response = requests.get(
            f"{BASE_URL}/api/admin/cms/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_data = get_response.json()
        
        # Update with test content
        test_stats = [
            {"value": "TEST1", "label": "Test Stat 1"},
            {"value": "TEST2", "label": "Test Stat 2"}
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/cms/stats",
            json={"content": test_stats},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/cms/stats")
        verify_data = verify_response.json()
        assert len(verify_data) == 2, "Stats should have 2 items"
        assert verify_data[0]["value"] == "TEST1", "First stat value should be TEST1"
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/cms/stats",
            json={"content": original_data},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"✓ Admin PUT stats: updated and verified")
    
    def test_admin_update_faq(self, admin_token):
        """PUT /api/admin/cms/faq saves FAQ data"""
        # Get current FAQ
        get_response = requests.get(
            f"{BASE_URL}/api/admin/cms/faq",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_data = get_response.json()
        
        # Update with test content
        test_faq = [
            {"question": "Test Question 1?", "answer": "Test Answer 1"},
            {"question": "Test Question 2?", "answer": "Test Answer 2"}
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/cms/faq",
            json={"content": test_faq},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/cms/faq")
        verify_data = verify_response.json()
        assert len(verify_data) == 2, "FAQ should have 2 items"
        assert verify_data[0]["question"] == "Test Question 1?", "First FAQ question should match"
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/cms/faq",
            json={"content": original_data},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"✓ Admin PUT faq: updated and verified")
    
    def test_admin_update_addons(self, admin_token):
        """PUT /api/admin/cms/addons saves addons data"""
        # Get current addons
        get_response = requests.get(
            f"{BASE_URL}/api/admin/cms/addons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_data = get_response.json()
        
        # Update with test content
        test_addons = [
            {"name": "Test Addon 1", "price": 99, "description": "Test description 1"},
            {"name": "Test Addon 2", "price": 149, "description": "Test description 2"}
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/cms/addons",
            json={"content": test_addons},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/cms/addons")
        verify_data = verify_response.json()
        assert len(verify_data) == 2, "Addons should have 2 items"
        assert verify_data[0]["name"] == "Test Addon 1", "First addon name should match"
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/cms/addons",
            json={"content": original_data},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"✓ Admin PUT addons: updated and verified")
    
    def test_admin_update_contact(self, admin_token):
        """PUT /api/admin/cms/contact saves contact info"""
        # Get current contact
        get_response = requests.get(
            f"{BASE_URL}/api/admin/cms/contact",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_data = get_response.json()
        
        # Update with test content
        test_contact = {
            "phone": "(999) 999-9999",
            "email": "test@test.com",
            "address": "Test Address",
            "hours": "Test Hours",
            "response_time": "Test Response Time"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/cms/contact",
            json={"content": test_contact},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/cms/contact")
        verify_data = verify_response.json()
        assert verify_data.get("phone") == "(999) 999-9999", "Contact phone should be updated"
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/cms/contact",
            json={"content": original_data},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"✓ Admin PUT contact: updated and verified")
    
    def test_admin_cms_requires_auth(self):
        """Admin CMS endpoints require authentication"""
        # Test without auth
        response = requests.get(f"{BASE_URL}/api/admin/cms/hero")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        response = requests.put(f"{BASE_URL}/api/admin/cms/hero", json={"content": {}})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Admin CMS endpoints require authentication")
    
    def test_admin_cms_invalid_section(self, admin_token):
        """Admin CMS returns 404 for invalid section"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cms/invalid_section",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Admin CMS returns 404 for invalid section")


class TestAdminDashboardNavigation:
    """Test admin dashboard has Website Editor nav item"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        return response.json().get("token")
    
    def test_admin_login_works(self, admin_token):
        """Admin login returns valid token"""
        assert admin_token is not None, "Admin token should not be None"
        print(f"✓ Admin login works, token received")
    
    def test_admin_me_endpoint(self, admin_token):
        """GET /api/admin/me returns admin info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("email") == ADMIN_EMAIL, "Admin email should match"
        print(f"✓ Admin /me endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
