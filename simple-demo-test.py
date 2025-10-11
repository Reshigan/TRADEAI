#!/usr/bin/env python3
"""
TRADEAI v2.0 - Simple Demo Company Test
======================================

Quick validation test for core functionality before production deployment.
"""

import requests
import json
import time

def test_api_health():
    """Test API health"""
    print("🏥 Testing API Health...")
    try:
        response = requests.get("http://localhost:8000/api/v1/health/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Health: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ API Health failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health error: {e}")
        return False

def test_api_documentation():
    """Test API documentation"""
    print("📚 Testing API Documentation...")
    try:
        response = requests.get("http://localhost:8000/openapi.json", timeout=10)
        if response.status_code == 200:
            data = response.json()
            paths = data.get("paths", {})
            print(f"✅ API Documentation: {len(paths)} endpoints documented")
            return True
        else:
            print(f"❌ API Documentation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Documentation error: {e}")
        return False

def test_performance():
    """Test API performance"""
    print("⚡ Testing API Performance...")
    try:
        start_time = time.time()
        response = requests.get("http://localhost:8000/api/v1/health/", timeout=10)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000
        
        if response.status_code == 200 and response_time < 100:
            print(f"✅ Performance: {response_time:.2f}ms (Excellent)")
            return True
        elif response.status_code == 200 and response_time < 500:
            print(f"✅ Performance: {response_time:.2f}ms (Good)")
            return True
        else:
            print(f"⚠️ Performance: {response_time:.2f}ms (Needs improvement)")
            return False
    except Exception as e:
        print(f"❌ Performance error: {e}")
        return False

def test_concurrent_requests():
    """Test concurrent request handling"""
    print("🔄 Testing Concurrent Requests...")
    import threading
    import queue
    
    def make_request(result_queue):
        try:
            start_time = time.time()
            response = requests.get("http://localhost:8000/api/v1/health/", timeout=10)
            end_time = time.time()
            
            result_queue.put({
                'success': response.status_code == 200,
                'time': (end_time - start_time) * 1000
            })
        except Exception as e:
            result_queue.put({'success': False, 'error': str(e)})
    
    # Run 5 concurrent requests
    result_queue = queue.Queue()
    threads = []
    
    for i in range(5):
        thread = threading.Thread(target=make_request, args=(result_queue,))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Collect results
    results = []
    while not result_queue.empty():
        results.append(result_queue.get())
    
    successful_requests = sum(1 for r in results if r.get('success', False))
    
    if successful_requests >= 4:
        print(f"✅ Concurrent Requests: {successful_requests}/5 successful")
        return True
    else:
        print(f"⚠️ Concurrent Requests: {successful_requests}/5 successful")
        return False

def main():
    """Run simple demo tests"""
    print("🚀 TRADEAI v2.0 - SIMPLE DEMO VALIDATION")
    print("=" * 50)
    
    tests = [
        ("API Health Check", test_api_health),
        ("API Documentation", test_api_documentation),
        ("Performance Test", test_performance),
        ("Concurrent Requests", test_concurrent_requests)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}...")
        if test_func():
            passed += 1
    
    print("\n" + "=" * 50)
    print("📊 SIMPLE DEMO TEST RESULTS")
    print("=" * 50)
    
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"📈 Results: {passed}/{total} tests passed ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("🏆 EXCELLENT: System ready for production!")
        return True
    elif success_rate >= 75:
        print("🥇 GOOD: System meets basic requirements")
        return True
    else:
        print("⚠️ NEEDS WORK: System requires fixes")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)