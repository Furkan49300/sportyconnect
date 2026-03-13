import requests
import sys
import json
from datetime import datetime

class SportsActivityAPITester:
    def __init__(self, base_url="https://sporty-connect-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1773392886062"  # From MongoDB setup
        self.user_id = "test-user-1773392886062"  # From MongoDB setup
        self.tests_run = 0
        self.tests_passed = 0
        self.created_activity_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return True, response.json()
                    except:
                        return True, response.text
                return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_sports_endpoint(self):
        """Test GET /api/sports"""
        success, response = self.run_test(
            "Get Sports List",
            "GET",
            "sports",
            200
        )
        if success:
            print(f"   Sports available: {len(response.get('sports', []))}")
        return success

    def test_levels_endpoint(self):
        """Test GET /api/levels"""
        success, response = self.run_test(
            "Get Levels List",
            "GET", 
            "levels",
            200
        )
        if success:
            print(f"   Levels available: {len(response.get('levels', []))}")
        return success

    def test_activities_list(self):
        """Test GET /api/activities"""
        success, response = self.run_test(
            "Get Activities List",
            "GET",
            "activities",
            200
        )
        if success:
            print(f"   Total activities: {response.get('total', 0)}")
        return success

    def test_auth_me_without_token(self):
        """Test GET /api/auth/me without authentication"""
        success, response = self.run_test(
            "Auth Me - No Token (Should Fail)",
            "GET",
            "auth/me",
            401,
            auth_required=False
        )
        return success

    def test_auth_me_with_token(self):
        """Test GET /api/auth/me with authentication"""
        success, response = self.run_test(
            "Auth Me - With Token",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        if success:
            print(f"   User: {response.get('name', 'Unknown')} ({response.get('email', 'No email')})")
        return success

    def test_create_activity(self):
        """Test POST /api/activities"""
        activity_data = {
            "sport": "Soccer",
            "title": "Weekend Soccer Match",
            "description": "Join us for a fun soccer game in the park",
            "location": "Central Park Field 1",
            "city": "New York",
            "date": "2026-03-01", 
            "time": "18:00",
            "max_participants": 10,
            "required_level": "Beginner"
        }
        
        success, response = self.run_test(
            "Create Activity",
            "POST",
            "activities",
            200,
            data=activity_data,
            auth_required=True
        )
        
        if success and response:
            self.created_activity_id = response.get("activity_id")
            print(f"   Created activity ID: {self.created_activity_id}")
        return success

    def test_get_activity_detail(self):
        """Test GET /api/activities/{id}"""
        if not self.created_activity_id:
            print("❌ Skipping - No activity ID from previous test")
            return False
            
        success, response = self.run_test(
            "Get Activity Detail",
            "GET",
            f"activities/{self.created_activity_id}",
            200
        )
        if success:
            print(f"   Activity: {response.get('title', 'Unknown')}")
            print(f"   Participants: {len(response.get('participants', []))}")
        return success

    def test_join_activity(self):
        """Test POST /api/activities/{id}/join - Should fail as creator already joined"""
        if not self.created_activity_id:
            print("❌ Skipping - No activity ID from previous test")
            return False
            
        success, response = self.run_test(
            "Join Activity (Should Fail - Already Joined)",
            "POST",
            f"activities/{self.created_activity_id}/join",
            400,  # Expecting 400 as creator is already joined
            auth_required=True
        )
        return success

    def test_leave_activity(self):
        """Test DELETE /api/activities/{id}/leave - Should fail as creator cannot leave"""
        if not self.created_activity_id:
            print("❌ Skipping - No activity ID from previous test")
            return False
            
        success, response = self.run_test(
            "Leave Activity (Should Fail - Creator Cannot Leave)",
            "DELETE",
            f"activities/{self.created_activity_id}/leave",
            400,  # Expecting 400 as creator cannot leave
            auth_required=True
        )
        return success

    def test_update_profile(self):
        """Test PUT /api/users/profile"""
        profile_data = {
            "name": "Updated Test User",
            "city": "Test City",
            "bio": "Updated bio for testing",
            "favorite_sports": ["Soccer", "Tennis"],
            "athletic_level": "Intermediate"
        }
        
        success, response = self.run_test(
            "Update User Profile",
            "PUT",
            "users/profile",
            200,
            data=profile_data,
            auth_required=True
        )
        if success:
            print(f"   Updated name: {response.get('name', 'Unknown')}")
            print(f"   City: {response.get('city', 'Unknown')}")
        return success

    def test_get_dashboard(self):
        """Test GET /api/dashboard"""
        success, response = self.run_test(
            "Get User Dashboard",
            "GET",
            "dashboard",
            200,
            auth_required=True
        )
        if success:
            print(f"   Created activities: {response.get('total_created', 0)}")
            print(f"   Joined activities: {response.get('total_joined', 0)}")
            print(f"   Average rating: {response.get('average_rating', 0)}")
        return success

    def test_rate_player(self):
        """Test POST /api/activities/{id}/rate - Should fail as cannot rate yourself"""
        if not self.created_activity_id:
            print("❌ Skipping - No activity ID from previous test")
            return False
            
        rating_data = {
            "rated_id": self.user_id,  # Rating yourself should fail
            "score": 5,
            "comment": "Great player!"
        }
        
        success, response = self.run_test(
            "Rate Player (Should Fail - Self Rating)",
            "POST",
            f"activities/{self.created_activity_id}/rate",
            400,  # Expecting 400 as cannot rate yourself
            data=rating_data,
            auth_required=True
        )
        return success

    def test_delete_activity(self):
        """Test DELETE /api/activities/{id}"""
        if not self.created_activity_id:
            print("❌ Skipping - No activity ID from previous test")
            return False
            
        success, response = self.run_test(
            "Delete Activity",
            "DELETE",
            f"activities/{self.created_activity_id}",
            200,
            auth_required=True
        )
        if success:
            print(f"   Activity deleted successfully")
        return success

def main():
    print("🏀 Starting Sports Activity Platform API Tests...")
    print("=" * 60)
    
    tester = SportsActivityAPITester()
    
    # Test public endpoints
    print("\n📋 PUBLIC ENDPOINTS")
    tester.test_sports_endpoint()
    tester.test_levels_endpoint()
    tester.test_activities_list()
    
    # Test auth endpoints
    print("\n🔐 AUTHENTICATION TESTS")
    tester.test_auth_me_without_token()
    tester.test_auth_me_with_token()
    
    # Test activity CRUD
    print("\n🏃‍♂️ ACTIVITY MANAGEMENT")
    tester.test_create_activity()
    tester.test_get_activity_detail()
    
    # Test activity participation
    print("\n👥 ACTIVITY PARTICIPATION")
    tester.test_join_activity()
    tester.test_leave_activity()
    
    # Test user features
    print("\n👤 USER FEATURES")
    tester.test_update_profile()
    tester.test_get_dashboard()
    tester.test_rate_player()
    
    # Clean up
    print("\n🗑️  CLEANUP")
    tester.test_delete_activity()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())