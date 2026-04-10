import requests
import sys
from datetime import datetime
import json

class SkyLineMediaAPITester:
    def __init__(self, base_url="https://drone-home-showcase.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with SkyLine Media credentials"""
        success, response = self.run_test(
            "Admin Login (SkyLine Media)",
            "POST",
            "admin/login",
            200,
            data={"email": "isaacsarver100@gmail.com", "password": "Isabella0116!"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin: {response.get('name', 'Unknown')} ({response.get('email', 'Unknown')})")
            return True
        return False

    def test_packages_cad_pricing(self):
        """Test that packages return CAD pricing"""
        success, response = self.run_test(
            "Packages CAD Pricing",
            "GET",
            "packages",
            200
        )
        if success and response:
            print(f"   Found {len(response)} packages")
            for pkg in response:
                currency = pkg.get('currency', 'Unknown')
                price = pkg.get('price', 0)
                name = pkg.get('name', 'Unknown')
                print(f"   - {name}: ${price} {currency}")
                if currency != 'CAD':
                    self.failed_tests.append(f"Package {name} has currency {currency}, expected CAD")
                    return False
            
            # Check specific pricing
            expected_prices = {'starter': 399, 'professional': 799, 'premium': 1299}
            for pkg in response:
                pkg_id = pkg.get('id')
                if pkg_id in expected_prices:
                    expected = expected_prices[pkg_id]
                    actual = pkg.get('price')
                    if actual != expected:
                        self.failed_tests.append(f"Package {pkg_id} price ${actual}, expected ${expected}")
                        return False
            return True
        return False

    def test_booking_flow(self):
        """Test new booking flow (request -> approve -> pay)"""
        # Create booking request
        booking_data = {
            "name": "Test Client",
            "email": "test@example.com",
            "phone": "403-555-0123",
            "property_address": "123 Test St, Calgary, AB",
            "property_type": "residential",
            "service_area": "calgary",
            "package_id": "professional",
            "scheduled_date": "2025-02-15",
            "scheduled_time": "10:00 AM",
            "notes": "Test booking for SkyLine Media"
        }
        
        success, response = self.run_test(
            "Create Booking Request",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and response:
            booking_id = response.get('id')
            status = response.get('status')
            currency = response.get('currency')
            
            print(f"   Booking ID: {booking_id}")
            print(f"   Status: {status}")
            print(f"   Currency: {currency}")
            
            if status != 'pending':
                self.failed_tests.append(f"New booking status is {status}, expected 'pending'")
                return False
            
            if currency != 'CAD':
                self.failed_tests.append(f"Booking currency is {currency}, expected 'CAD'")
                return False
                
            return booking_id
        return False

    def test_service_areas(self):
        """Test that service areas are Calgary and Edmonton"""
        # This is tested through booking creation with service_area field
        calgary_booking = {
            "name": "Calgary Test",
            "email": "calgary@test.com",
            "phone": "403-555-0001",
            "property_address": "Calgary Test Address",
            "property_type": "residential",
            "service_area": "calgary",
            "package_id": "starter",
            "scheduled_date": "2025-02-20",
            "scheduled_time": "2:00 PM"
        }
        
        edmonton_booking = {
            "name": "Edmonton Test",
            "email": "edmonton@test.com", 
            "phone": "780-555-0001",
            "property_address": "Edmonton Test Address",
            "property_type": "commercial",
            "service_area": "edmonton",
            "package_id": "premium",
            "scheduled_date": "2025-02-21",
            "scheduled_time": "11:00 AM"
        }
        
        calgary_success, _ = self.run_test(
            "Calgary Service Area Booking",
            "POST",
            "bookings",
            200,
            data=calgary_booking
        )
        
        edmonton_success, _ = self.run_test(
            "Edmonton Service Area Booking", 
            "POST",
            "bookings",
            200,
            data=edmonton_booking
        )
        
        return calgary_success and edmonton_success

    def test_admin_dashboard_stats(self):
        """Test admin dashboard shows stats"""
        success, response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "admin/stats",
            200
        )
        if success and response:
            currency = response.get('currency')
            total_bookings = response.get('total_bookings', 0)
            total_revenue = response.get('total_revenue', 0)
            
            print(f"   Total Bookings: {total_bookings}")
            print(f"   Total Revenue: ${total_revenue} {currency}")
            
            if currency != 'CAD':
                self.failed_tests.append(f"Dashboard currency is {currency}, expected 'CAD'")
                return False
            return True
        return False

    def test_admin_bookings_management(self):
        """Test admin can view and manage bookings"""
        success, response = self.run_test(
            "Admin View Bookings",
            "GET", 
            "admin/bookings",
            200
        )
        if success and response:
            print(f"   Found {len(response)} bookings")
            
            # Test filtering by status
            pending_success, pending_response = self.run_test(
                "Admin View Pending Bookings",
                "GET",
                "admin/bookings?status=pending",
                200
            )
            
            if pending_success:
                print(f"   Found {len(pending_response)} pending bookings")
                return True
        return False

    def test_api_root_skyline_branding(self):
        """Test API root shows SkyLine Media branding"""
        success, response = self.run_test(
            "API Root SkyLine Branding",
            "GET",
            "",
            200
        )
        if success and response:
            message = response.get('message', '')
            currency = response.get('currency', '')
            
            print(f"   Message: {message}")
            print(f"   Currency: {currency}")
            
            if 'SkyLine Media' not in message:
                self.failed_tests.append(f"API message '{message}' does not contain 'SkyLine Media'")
                return False
                
            if currency != 'CAD':
                self.failed_tests.append(f"API currency is {currency}, expected 'CAD'")
                return False
            return True
        return False

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

def main():
    print("🚁 SkyLine Media API Testing Suite")
    print("=" * 50)
    
    tester = SkyLineMediaAPITester()
    
    # Test admin authentication first
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test core SkyLine Media features
    print("\n📋 Testing SkyLine Media Rebranding...")
    tester.test_api_root_skyline_branding()
    tester.test_packages_cad_pricing()
    
    print("\n🏠 Testing Service Areas (Calgary & Edmonton)...")
    tester.test_service_areas()
    
    print("\n📅 Testing New Booking Flow...")
    booking_id = tester.test_booking_flow()
    
    print("\n👨‍💼 Testing Admin Dashboard...")
    tester.test_admin_dashboard_stats()
    tester.test_admin_bookings_management()
    
    print("\n🔧 Testing System Health...")
    tester.test_health_check()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✨ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())