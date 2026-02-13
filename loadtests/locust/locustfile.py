"""
Locust Load Test for Contoso University API
Test Name: MCP-VS-LT-example
Target: https://cntso-ecgs-api.azurewebsites.net/api/courses/5

Configuration:
- Virtual Users: 5
- Requests per minute: 300 (60 requests/user/minute = 1 request/user/second)
- Duration: 3 minutes
"""

from locust import HttpUser, task, constant_throughput


class CoursesAPIUser(HttpUser):
    """
    Simulates a user accessing the Courses API endpoint.
    
    With 5 users and constant_throughput(1), each user makes 1 request/second.
    Total: 5 users * 1 req/sec * 60 sec = 300 requests/minute
    """
    
    # Each user waits to achieve ~1 request per second (60 requests/minute per user)
    # With 5 users: 5 * 60 = 300 requests/minute total
    wait_time = constant_throughput(1)  # 1 request per second per user
    
    # Target host - Azure Load Testing will override this with the endpoint URL
    host = "https://cntso-ecgs-api.azurewebsites.net"
    
    @task
    def get_course_by_id(self):
        """
        GET request to fetch course with ID 5
        Endpoint: /api/courses/5
        """
        with self.client.get(
            "/api/courses/5",
            name="GET /api/courses/5",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # Course not found - may be expected in some scenarios
                response.failure(f"Course not found: {response.status_code}")
            else:
                response.failure(f"Unexpected status code: {response.status_code}")
    
    def on_start(self):
        """
        Called when a simulated user starts.
        Can be used for setup like authentication.
        """
        pass
    
    def on_stop(self):
        """
        Called when a simulated user stops.
        Can be used for cleanup.
        """
        pass
