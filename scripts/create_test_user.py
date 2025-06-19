#!/usr/bin/env python3
import requests
import json

def main():
    # Create a new test user via the registration API
    user_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "test123",
        "confirmPassword": "test123",
        "beltColor": "white",
        "experienceTime": "less_than_1_year"
    }
    
    print("🔄 Creating new test user...")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print("✅ Test user created successfully!")
            print(f"📧 Username: testuser")
            print(f"🔐 Password: test123")
            print()
            print("🚀 You can now login with these credentials!")
            
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in error_data.get("message", ""):
                print("⚠️  User 'testuser' already exists")
                print(f"📧 Username: testuser")
                print(f"🔐 Password: test123")
                print()
                print("🚀 Try logging in with these credentials!")
            else:
                print(f"❌ Registration failed: {error_data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Registration failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the server is running on localhost:5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 