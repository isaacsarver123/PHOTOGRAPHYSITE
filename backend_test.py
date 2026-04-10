import requests
import sys
import json
import os
from datetime import datetime

class DronePhotographyAPITester:
    def __init__(self, base_url="https://drone-home-showcase.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_token = None
        self.admin_credentials = {
            "email": "isaacsarver100@gmail.com",
            "password": "Isabella0116!"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            response = None
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "api/", 200)
        self.run_test("Health Check", "GET", "api/health", 200)

    def test_portfolio_endpoints(self):
        """Test portfolio endpoints"""
        print("\n" + "="*50)
        print("TESTING PORTFOLIO ENDPOINTS")
        print("="*50)
        
        # Test get all portfolio items
        success, portfolio_data = self.run_test("Get Portfolio", "GET", "api/portfolio", 200)
        
        if success and portfolio_data:
            print(f"   Found {len(portfolio_data)} portfolio items")
            
            # Test filtering by category
            self.run_test("Filter Portfolio - Residential", "GET", "api/portfolio?category=residential", 200)
            self.run_test("Filter Portfolio - Commercial", "GET", "api/portfolio?category=commercial", 200)
            
            # Test get single portfolio item
            if len(portfolio_data) > 0:
                item_id = portfolio_data[0].get('id')
                if item_id:
                    self.run_test("Get Single Portfolio Item", "GET", f"api/portfolio/{item_id}", 200)

    def test_packages_endpoints(self):
        """Test pricing packages endpoints"""
        print("\n" + "="*50)
        print("TESTING PACKAGES ENDPOINTS")
        print("="*50)
        
        # Test get all packages
        success, packages_data = self.run_test("Get All Packages", "GET", "api/packages", 200)
        
        if success and packages_data:
            print(f"   Found {len(packages_data)} packages")
            
            # Verify expected packages exist
            package_ids = [pkg.get('id') for pkg in packages_data]
            expected_packages = ['starter', 'professional', 'premium']
            
            for pkg_id in expected_packages:
                if pkg_id in package_ids:
                    print(f"   ✅ Package '{pkg_id}' found")
                    # Test get single package
                    self.run_test(f"Get {pkg_id} Package", "GET", f"api/packages/{pkg_id}", 200)
                else:
                    print(f"   ❌ Package '{pkg_id}' missing")

    def test_contact_endpoint(self):
        """Test contact form submission"""
        print("\n" + "="*50)
        print("TESTING CONTACT ENDPOINT")
        print("="*50)
        
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "555-0123",
            "property_address": "123 Test St, Austin, TX",
            "service_type": "residential",
            "message": "This is a test contact form submission"
        }
        
        self.run_test("Submit Contact Form", "POST", "api/contact", 200, contact_data)

    def test_chat_endpoint(self):
        """Test AI chat endpoint"""
        print("\n" + "="*50)
        print("TESTING CHAT ENDPOINT")
        print("="*50)
        
        chat_data = {
            "session_id": f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "message": "What are your pricing packages?"
        }
        
        print("   Note: Chat response may take a few seconds...")
        success, response = self.run_test("Send Chat Message", "POST", "api/chat", 200, chat_data)
        
        if success and response:
            chat_response = response.get('response', '')
            print(f"   Chat response length: {len(chat_response)} characters")
            if len(chat_response) > 0:
                print(f"   Response preview: {chat_response[:100]}...")

    def test_booking_endpoints(self):
        """Test booking creation"""
        print("\n" + "="*50)
        print("TESTING BOOKING ENDPOINTS")
        print("="*50)
        
        booking_data = {
            "name": "Test Customer",
            "email": "customer@example.com",
            "phone": "555-0123",
            "property_address": "456 Test Ave, Austin, TX",
            "property_type": "residential",
            "package_id": "starter",
            "scheduled_date": "2025-02-15",
            "scheduled_time": "10:00 AM",
            "notes": "Test booking"
        }
        
        success, booking_response = self.run_test("Create Booking", "POST", "api/bookings", 200, booking_data)
        
        if success and booking_response:
            booking_id = booking_response.get('id')
            if booking_id:
                print(f"   Created booking with ID: {booking_id}")
                
                # Test get single booking
                self.run_test("Get Single Booking", "GET", f"api/bookings/{booking_id}", 200)

    def test_admin_auth(self):
        """Test admin authentication"""
        print("\n" + "="*50)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*50)
        
        # Test admin login
        success, login_response = self.run_test(
            "Admin Login", 
            "POST", 
            "api/admin/login", 
            200, 
            self.admin_credentials
        )
        
        if success and login_response:
            self.admin_token = login_response.get('token')
            print(f"   Admin token received: {self.admin_token[:20]}...")
            
            # Test get admin info
            admin_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            }
            
            self.run_test("Get Admin Info", "GET", "api/admin/me", 200, headers=admin_headers)
        else:
            print("❌ Admin login failed - cannot test admin endpoints")

    def test_admin_dashboard_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            print("⚠️  Skipping admin stats test - no admin token")
            return
            
        print("\n" + "="*50)
        print("TESTING ADMIN DASHBOARD STATS")
        print("="*50)
        
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, stats_data = self.run_test("Get Admin Stats", "GET", "api/admin/stats", 200, headers=admin_headers)
        
        if success and stats_data:
            expected_keys = ['total_bookings', 'pending_bookings', 'confirmed_bookings', 
                           'completed_bookings', 'total_clients', 'total_contacts', 
                           'new_contacts', 'total_revenue']
            
            for key in expected_keys:
                if key in stats_data:
                    print(f"   ✅ {key}: {stats_data[key]}")
                else:
                    print(f"   ❌ Missing stat: {key}")

    def test_admin_bookings(self):
        """Test admin booking management"""
        if not self.admin_token:
            print("⚠️  Skipping admin bookings test - no admin token")
            return
            
        print("\n" + "="*50)
        print("TESTING ADMIN BOOKING MANAGEMENT")
        print("="*50)
        
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test get all bookings
        success, bookings_data = self.run_test("Get All Bookings", "GET", "api/admin/bookings", 200, headers=admin_headers)
        
        if success and bookings_data:
            print(f"   Found {len(bookings_data)} bookings")
            
            # Test filtering by status
            self.run_test("Filter Bookings - Pending", "GET", "api/admin/bookings?status=pending", 200, headers=admin_headers)
            self.run_test("Filter Bookings - Confirmed", "GET", "api/admin/bookings?status=confirmed", 200, headers=admin_headers)
            
            # Test get single booking if any exist
            if len(bookings_data) > 0:
                booking_id = bookings_data[0].get('id')
                if booking_id:
                    self.run_test("Get Single Booking", "GET", f"api/admin/bookings/{booking_id}", 200, headers=admin_headers)
                    
                    # Test status update
                    status_update = {"status": "confirmed"}
                    self.run_test("Update Booking Status", "PUT", f"api/admin/bookings/{booking_id}/status", 200, 
                                status_update, headers=admin_headers)

    def test_admin_clients(self):
        """Test admin client management"""
        if not self.admin_token:
            print("⚠️  Skipping admin clients test - no admin token")
            return
            
        print("\n" + "="*50)
        print("TESTING ADMIN CLIENT MANAGEMENT")
        print("="*50)
        
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, clients_data = self.run_test("Get All Clients", "GET", "api/admin/clients", 200, headers=admin_headers)
        
        if success and clients_data:
            print(f"   Found {len(clients_data)} clients")

    def test_admin_contacts(self):
        """Test admin contact management"""
        if not self.admin_token:
            print("⚠️  Skipping admin contacts test - no admin token")
            return
            
        print("\n" + "="*50)
        print("TESTING ADMIN CONTACT MANAGEMENT")
        print("="*50)
        
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test get all contacts
        success, contacts_data = self.run_test("Get All Contacts", "GET", "api/admin/contacts", 200, headers=admin_headers)
        
        if success and contacts_data:
            print(f"   Found {len(contacts_data)} contacts")
            
            # Test filtering by status
            self.run_test("Filter Contacts - New", "GET", "api/admin/contacts?status=new", 200, headers=admin_headers)
            
            # Test status update if any contacts exist
            if len(contacts_data) > 0:
                contact_id = contacts_data[0].get('id')
                if contact_id:
                    self.run_test("Update Contact Status", "PUT", f"api/admin/contacts/{contact_id}/status?status=contacted", 200, 
                                {}, headers=admin_headers)

    def test_photo_upload_endpoint(self):
        """Test photo upload functionality"""
        if not self.admin_token:
            print("⚠️  Skipping photo upload test - no admin token")
            return
            
        print("\n" + "="*50)
        print("TESTING PHOTO UPLOAD ENDPOINT")
        print("="*50)
        
        # First create a test booking to upload photos to
        booking_data = {
            "name": "Photo Test Customer",
            "email": "phototest@example.com",
            "phone": "555-0123",
            "property_address": "789 Photo Test St, Austin, TX",
            "property_type": "residential",
            "package_id": "starter",
            "scheduled_date": "2025-02-20",
            "scheduled_time": "2:00 PM",
            "notes": "Test booking for photo upload"
        }
        
        success, booking_response = self.run_test("Create Test Booking for Photos", "POST", "api/bookings", 200, booking_data)
        
        if success and booking_response:
            booking_id = booking_response.get('id')
            print(f"   Created test booking: {booking_id}")
            
            # Note: We can't actually upload a file in this test without creating a real file
            # But we can test that the endpoint exists and requires auth
            admin_headers = {
                'Authorization': f'Bearer {self.admin_token}'
            }
            
            # Test that the endpoint exists (will fail without file, but should not be 404)
            url = f"{self.base_url}/api/admin/bookings/{booking_id}/photos"
            try:
                response = requests.post(url, headers=admin_headers, timeout=10)
                # Expect 422 (validation error) since we're not sending a file
                if response.status_code in [422, 400]:
                    print("✅ Photo upload endpoint exists and requires file")
                    self.tests_passed += 1
                else:
                    print(f"❌ Unexpected response: {response.status_code}")
                self.tests_run += 1
            except Exception as e:
                print(f"❌ Error testing photo upload: {e}")
                self.tests_run += 1

    def test_email_notification_logging(self):
        """Test email notification logging (mocked)"""
        print("\n" + "="*50)
        print("TESTING EMAIL NOTIFICATION LOGGING")
        print("="*50)
        
        # Create a booking and check if confirmation email is logged
        booking_data = {
            "name": "Email Test Customer",
            "email": "emailtest@example.com",
            "phone": "555-0123",
            "property_address": "321 Email Test Rd, Austin, TX",
            "property_type": "residential",
            "package_id": "professional",
            "scheduled_date": "2025-02-25",
            "scheduled_time": "11:00 AM",
            "notes": "Test booking for email notification"
        }
        
        success, booking_response = self.run_test("Create Booking for Email Test", "POST", "api/bookings", 200, booking_data)
        
        if success:
            print("   ✅ Booking created - email notification should be logged to console")
            print("   Note: Email notifications are MOCKED and logged to backend console")
        
        # Test contact form email notification
        contact_data = {
            "name": "Email Test Contact",
            "email": "contacttest@example.com",
            "phone": "555-0123",
            "property_address": "654 Contact Test Blvd, Austin, TX",
            "service_type": "commercial",
            "message": "Test contact for email notification"
        }
        
        success, contact_response = self.run_test("Submit Contact for Email Test", "POST", "api/contact", 200, contact_data)
        
    def test_seed_portfolio(self):
        """Test portfolio seeding"""
        print("\n" + "="*50)
        print("TESTING PORTFOLIO SEEDING")
        print("="*50)
        
        self.run_test("Seed Portfolio", "POST", "api/seed-portfolio", 200)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\nFAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                    print(f"   Response: {test['response']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚁 SkyView Drone Photography API Testing")
    print("=" * 60)
    
    tester = DronePhotographyAPITester()
    
    # Run all tests
    tester.test_health_endpoints()
    tester.test_packages_endpoints()
    tester.test_portfolio_endpoints()
    tester.test_contact_endpoint()
    tester.test_chat_endpoint()
    tester.test_booking_endpoints()
    tester.test_seed_portfolio()
    
    # Test admin features
    tester.test_admin_auth()
    tester.test_admin_dashboard_stats()
    tester.test_admin_bookings()
    tester.test_admin_clients()
    tester.test_admin_contacts()
    tester.test_photo_upload_endpoint()
    tester.test_email_notification_logging()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())