#!/usr/bin/env python3
"""
Backend API Testing Script for LootBar Free Fire Clone
Tests all endpoints including public, admin, and auth-gated routes
"""

import requests
import json
import subprocess
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://fire-topup-store.preview.emergentagent.com/api"
ADMIN_USERNAME = "freefire"
ADMIN_PASSWORD = "rk212006"
DB_NAME = "test_database"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log_test(name, passed, details=""):
    """Log test result"""
    test_results["total"] += 1
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    
    if passed:
        test_results["passed"].append(name)
    else:
        test_results["failed"].append({"name": name, "details": details})

def create_test_user_session():
    """Create test user and session via mongosh"""
    print("\n" + "="*80)
    print("CREATING TEST USER AND SESSION VIA MONGOSH")
    print("="*80)
    
    mongosh_script = f"""
use('{DB_NAME}');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({{ 
    user_id: userId, 
    email: 'test.user.' + Date.now() + '@example.com', 
    name: 'Test User', 
    picture: 'https://via.placeholder.com/150', 
    created_at: new Date() 
}});
db.user_sessions.insertOne({{ 
    user_id: userId, 
    session_token: sessionToken, 
    expires_at: new Date(Date.now() + 7*24*60*60*1000), 
    created_at: new Date() 
}});
print(JSON.stringify({{ session_token: sessionToken, user_id: userId }}));
"""
    
    try:
        result = subprocess.run(
            ["mongosh", "--quiet", "--eval", mongosh_script],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            print(f"❌ Failed to create test user: {result.stderr}")
            return None, None
        
        # Parse the output to get session_token and user_id
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            if 'session_token' in line:
                data = json.loads(line)
                session_token = data['session_token']
                user_id = data['user_id']
                print(f"✅ Created test user: {user_id}")
                print(f"✅ Session token: {session_token}")
                return session_token, user_id
        
        print(f"❌ Could not parse mongosh output: {result.stdout}")
        return None, None
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        return None, None

def cleanup_test_data(user_id=None):
    """Clean up test data from database"""
    if not user_id:
        return
    
    print(f"\n🧹 Cleaning up test data for user: {user_id}")
    
    mongosh_script = f"""
use('{DB_NAME}');
db.users.deleteMany({{ user_id: '{user_id}' }});
db.user_sessions.deleteMany({{ user_id: '{user_id}' }});
db.orders.deleteMany({{ user_id: '{user_id}' }});
print('Cleanup complete');
"""
    
    try:
        subprocess.run(
            ["mongosh", "--quiet", "--eval", mongosh_script],
            capture_output=True,
            text=True,
            timeout=10
        )
        print("✅ Test data cleaned up")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {str(e)}")

def test_get_packages():
    """Test GET /api/packages - should return list with 8 default packages"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/packages (public, seeds defaults)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/packages", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/packages", False, f"Status code: {response.status_code}")
            return
        
        packages = response.json()
        
        if not isinstance(packages, list):
            log_test("GET /api/packages", False, "Response is not a list")
            return
        
        if len(packages) == 0:
            log_test("GET /api/packages", False, "No packages returned")
            return
        
        # Verify structure of first package
        required_fields = ["id", "name", "image", "price", "originalPrice", "tag"]
        first_package = packages[0]
        missing_fields = [f for f in required_fields if f not in first_package]
        
        if missing_fields:
            log_test("GET /api/packages", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("GET /api/packages", True, f"Returned {len(packages)} packages with correct structure")
        
    except Exception as e:
        log_test("GET /api/packages", False, f"Exception: {str(e)}")

def test_get_settings():
    """Test GET /api/settings - should return store settings"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/settings (public, seeds default)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/settings", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/settings", False, f"Status code: {response.status_code}")
            return
        
        settings = response.json()
        
        required_fields = ["productImage", "title", "rating", "ratingCount", "soldCount"]
        missing_fields = [f for f in required_fields if f not in settings]
        
        if missing_fields:
            log_test("GET /api/settings", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("GET /api/settings", True, f"Settings returned with correct structure")
        
    except Exception as e:
        log_test("GET /api/settings", False, f"Exception: {str(e)}")

def test_admin_login():
    """Test POST /api/admin/login with correct and wrong credentials"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/admin/login")
    print("="*80)
    
    # Test with correct credentials
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("Admin login (correct credentials)", False, f"Status code: {response.status_code}")
            return None
        
        data = response.json()
        
        if "admin_token" not in data:
            log_test("Admin login (correct credentials)", False, "No admin_token in response")
            return None
        
        admin_token = data["admin_token"]
        log_test("Admin login (correct credentials)", True, f"Token received: {admin_token[:20]}...")
        
    except Exception as e:
        log_test("Admin login (correct credentials)", False, f"Exception: {str(e)}")
        return None
    
    # Test with wrong credentials
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": "wrong", "password": "wrong"},
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("Admin login (wrong credentials)", True, "Correctly returned 401")
        else:
            log_test("Admin login (wrong credentials)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("Admin login (wrong credentials)", False, f"Exception: {str(e)}")
    
    return admin_token

def test_admin_packages(admin_token):
    """Test PUT /api/admin/packages with and without token"""
    print("\n" + "="*80)
    print("TEST 4: PUT /api/admin/packages")
    print("="*80)
    
    # Test without token
    try:
        test_packages = [
            {
                "id": "test1",
                "name": "Test Package",
                "image": "https://example.com/test.jpg",
                "price": 1.0,
                "originalPrice": 2.0,
                "tag": "Test"
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/admin/packages",
            json=test_packages,
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("PUT /admin/packages (no token)", True, "Correctly returned 401")
        else:
            log_test("PUT /admin/packages (no token)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("PUT /admin/packages (no token)", False, f"Exception: {str(e)}")
    
    # Test with valid token
    if not admin_token:
        log_test("PUT /admin/packages (with token)", False, "No admin token available")
        return
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/packages",
            json=test_packages,
            headers={"X-Admin-Token": admin_token},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("PUT /admin/packages (with token)", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        # Verify the change by getting packages
        get_response = requests.get(f"{BASE_URL}/packages", timeout=10)
        packages = get_response.json()
        
        if len(packages) == 1 and packages[0]["name"] == "Test Package":
            log_test("PUT /admin/packages (with token)", True, "Packages updated and persisted")
        else:
            log_test("PUT /admin/packages (with token)", False, f"Packages not updated correctly. Got {len(packages)} packages")
        
        # Restore default packages
        restore_default_packages(admin_token)
        
    except Exception as e:
        log_test("PUT /admin/packages (with token)", False, f"Exception: {str(e)}")

def test_admin_settings(admin_token):
    """Test PUT /api/admin/settings with and without token"""
    print("\n" + "="*80)
    print("TEST 5: PUT /api/admin/settings")
    print("="*80)
    
    # Test without token
    try:
        test_settings = {
            "productImage": "https://example.com/test.jpg",
            "title": "Test Title",
            "rating": "4.5",
            "ratingCount": "100",
            "soldCount": "50"
        }
        
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            json=test_settings,
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("PUT /admin/settings (no token)", True, "Correctly returned 401")
        else:
            log_test("PUT /admin/settings (no token)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("PUT /admin/settings (no token)", False, f"Exception: {str(e)}")
    
    # Test with valid token
    if not admin_token:
        log_test("PUT /admin/settings (with token)", False, "No admin token available")
        return
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            json=test_settings,
            headers={"X-Admin-Token": admin_token},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("PUT /admin/settings (with token)", False, f"Status code: {response.status_code}")
            return
        
        # Verify the change by getting settings
        get_response = requests.get(f"{BASE_URL}/settings", timeout=10)
        settings = get_response.json()
        
        if settings["title"] == "Test Title":
            log_test("PUT /admin/settings (with token)", True, "Settings updated and persisted")
        else:
            log_test("PUT /admin/settings (with token)", False, "Settings not updated correctly")
        
        # Restore default settings
        restore_default_settings(admin_token)
        
    except Exception as e:
        log_test("PUT /admin/settings (with token)", False, f"Exception: {str(e)}")

def test_auth_me(session_token):
    """Test GET /api/auth/me with and without token"""
    print("\n" + "="*80)
    print("TEST 6: GET /api/auth/me")
    print("="*80)
    
    # Test without token
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if response.status_code == 401:
            log_test("GET /auth/me (no token)", True, "Correctly returned 401")
        else:
            log_test("GET /auth/me (no token)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("GET /auth/me (no token)", False, f"Exception: {str(e)}")
    
    # Test with invalid token
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("GET /auth/me (invalid token)", True, "Correctly returned 401")
        else:
            log_test("GET /auth/me (invalid token)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("GET /auth/me (invalid token)", False, f"Exception: {str(e)}")
    
    # Test with valid token
    if not session_token:
        log_test("GET /auth/me (valid token)", False, "No session token available")
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("GET /auth/me (valid token)", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        user_data = response.json()
        required_fields = ["user_id", "email", "name"]
        missing_fields = [f for f in required_fields if f not in user_data]
        
        if missing_fields:
            log_test("GET /auth/me (valid token)", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("GET /auth/me (valid token)", True, f"User data returned: {user_data['email']}")
        
    except Exception as e:
        log_test("GET /auth/me (valid token)", False, f"Exception: {str(e)}")

def test_orders(session_token):
    """Test POST /api/orders and GET /api/orders/me"""
    print("\n" + "="*80)
    print("TEST 7: POST /api/orders and GET /api/orders/me")
    print("="*80)
    
    # Test POST without auth
    try:
        order_data = {
            "package_name": "100+10 Diamonds",
            "uid": "FF123456789",
            "quantity": 1,
            "total": 0.82
        }
        
        response = requests.post(
            f"{BASE_URL}/orders",
            json=order_data,
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("POST /orders (no auth)", True, "Correctly returned 401")
        else:
            log_test("POST /orders (no auth)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("POST /orders (no auth)", False, f"Exception: {str(e)}")
    
    # Test POST with auth
    if not session_token:
        log_test("POST /orders (with auth)", False, "No session token available")
        log_test("GET /orders/me", False, "No session token available")
        return
    
    try:
        response = requests.post(
            f"{BASE_URL}/orders",
            json=order_data,
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("POST /orders (with auth)", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        order = response.json()
        required_fields = ["order_id", "user_id", "package_name", "uid", "quantity", "total"]
        missing_fields = [f for f in required_fields if f not in order]
        
        if missing_fields:
            log_test("POST /orders (with auth)", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("POST /orders (with auth)", True, f"Order created: {order['order_id']}")
        
    except Exception as e:
        log_test("POST /orders (with auth)", False, f"Exception: {str(e)}")
        return
    
    # Test GET /orders/me without auth
    try:
        response = requests.get(f"{BASE_URL}/orders/me", timeout=10)
        
        if response.status_code == 401:
            log_test("GET /orders/me (no auth)", True, "Correctly returned 401")
        else:
            log_test("GET /orders/me (no auth)", False, f"Expected 401, got {response.status_code}")
        
    except Exception as e:
        log_test("GET /orders/me (no auth)", False, f"Exception: {str(e)}")
    
    # Test GET /orders/me with auth
    try:
        response = requests.get(
            f"{BASE_URL}/orders/me",
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("GET /orders/me (with auth)", False, f"Status code: {response.status_code}")
            return
        
        orders = response.json()
        
        if not isinstance(orders, list):
            log_test("GET /orders/me (with auth)", False, "Response is not a list")
            return
        
        if len(orders) == 0:
            log_test("GET /orders/me (with auth)", False, "No orders returned (expected at least 1)")
            return
        
        log_test("GET /orders/me (with auth)", True, f"Retrieved {len(orders)} order(s)")
        
    except Exception as e:
        log_test("GET /orders/me (with auth)", False, f"Exception: {str(e)}")

def restore_default_packages(admin_token):
    """Restore default packages"""
    print("\n🔄 Restoring default packages...")
    
    default_packages = [
        {"id": "p1", "name": "EVO VAULT - one of the EVO Guns", "image": "https://img.lootbar.com/file/6a704cea477ed821a12c6eafKcFumR3d03?fop=imageView/2/w/340/h/340", "price": 11.25, "originalPrice": 12.5, "tag": "Hot"},
        {"id": "p2", "name": "BOOYAH PASS 50 Level Package", "image": "https://img.lootbar.com/file/6846ac3a4103a2e741d4df29vLW0rcHG03?fop=imageView/2/w/340/h/340", "price": 6.17, "originalPrice": 6.85, "tag": ""},
        {"id": "p3", "name": "100+10 Diamonds", "image": "https://img.lootbar.com/file/66dad2385bcd5dcccf249149UCmGWzPC03?fop=imageView/2/w/340/h/340", "price": 0.82, "originalPrice": 0.91, "tag": ""},
        {"id": "p4", "name": "310+31 Diamonds", "image": "https://img.lootbar.com/file/66dad319243d93be37a0c68bsOGJhFpw03?fop=imageView/2/w/340/h/340", "price": 2.3, "originalPrice": 2.55, "tag": ""},
        {"id": "p5", "name": "520+52 Diamonds", "image": "https://img.lootbar.com/file/66dad38a511befc0cea111c95pbxbPTi03?fop=imageView/2/w/340/h/340", "price": 3.87, "originalPrice": 4.3, "tag": "Popular"},
        {"id": "p6", "name": "1060+106 Diamonds", "image": "https://img.lootbar.com/file/66dad3cce4fffe79f93965924i0X7hAw03?fop=imageView/2/w/340/h/340", "price": 7.38, "originalPrice": 8.2, "tag": ""},
        {"id": "p7", "name": "2180+218 Diamonds", "image": "https://img.lootbar.com/file/66dad40d6d022e25d4932829egCbaMN703?fop=imageView/2/w/340/h/340", "price": 14.67, "originalPrice": 16.3, "tag": ""},
        {"id": "p8", "name": "5600+560 Diamonds", "image": "https://img.lootbar.com/file/66dad44b8ce4cfd72a97ee68tMW0piBg03?fop=imageView/2/w/340/h/340", "price": 35.1, "originalPrice": 39.0, "tag": "Best Value"},
    ]
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/packages",
            json=default_packages,
            headers={"X-Admin-Token": admin_token},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Default packages restored")
        else:
            print(f"⚠️  Failed to restore packages: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Error restoring packages: {str(e)}")

def restore_default_settings(admin_token):
    """Restore default settings"""
    print("\n🔄 Restoring default settings...")
    
    default_settings = {
        "productImage": "https://img.lootbar.com/file/6a3e1c094f9de0e50fdbb275k9gzzrFk03",
        "title": "Free Fire Top Up",
        "rating": "5.0",
        "ratingCount": "40,068",
        "soldCount": "100k+ Sold"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            json=default_settings,
            headers={"X-Admin-Token": admin_token},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Default settings restored")
        else:
            print(f"⚠️  Failed to restore settings: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Error restoring settings: {str(e)}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total tests: {test_results['total']}")
    print(f"Passed: {len(test_results['passed'])}")
    print(f"Failed: {len(test_results['failed'])}")
    print()
    
    if test_results['failed']:
        print("❌ FAILED TESTS:")
        for failure in test_results['failed']:
            print(f"  - {failure['name']}")
            if failure['details']:
                print(f"    {failure['details']}")
    else:
        print("✅ ALL TESTS PASSED!")
    
    print("="*80)

def main():
    """Main test execution"""
    print("="*80)
    print("LOOTBAR FREE FIRE CLONE - BACKEND API TESTING")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Database: {DB_NAME}")
    print(f"Admin User: {ADMIN_USERNAME}")
    print("="*80)
    
    session_token = None
    user_id = None
    admin_token = None
    
    try:
        # Test public endpoints
        test_get_packages()
        test_get_settings()
        
        # Test admin endpoints
        admin_token = test_admin_login()
        if admin_token:
            test_admin_packages(admin_token)
            test_admin_settings(admin_token)
        
        # Create test user and session for auth-gated tests
        session_token, user_id = create_test_user_session()
        
        # Test auth-gated endpoints
        if session_token:
            test_auth_me(session_token)
            test_orders(session_token)
        
    finally:
        # Cleanup
        if user_id:
            cleanup_test_data(user_id)
        
        # Print summary
        print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if len(test_results['failed']) == 0 else 1)

if __name__ == "__main__":
    main()
