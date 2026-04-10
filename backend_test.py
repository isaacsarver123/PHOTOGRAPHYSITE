import requests
import sys
import json
from datetime import datetime

class DronePhotographyAPITester:
    def __init__(self, base_url="https://drone-home-showcase.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

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
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())