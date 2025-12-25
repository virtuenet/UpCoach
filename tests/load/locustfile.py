"""
UpCoach API Load Testing Suite
Target: 1000 concurrent users, p95 latency < 200ms
"""

from locust import HttpUser, task, between
import json
import random

class UpCoachUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login and obtain auth token"""
        response = self.client.post("/api/auth/login", json={
            "email": f"loadtest+{random.randint(1, 10000)}@upcoach.com",
            "password": "TestPassword123!"
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # Fallback for testing - use mock token
            self.headers = {"Authorization": "Bearer test-token"}

    @task(3)
    def get_habits(self):
        """Get user habits - most frequent operation"""
        self.client.get("/api/habits", headers=self.headers)

    @task(2)
    def check_in_habit(self):
        """Check in a habit"""
        habit_id = f"test-habit-{random.randint(1, 100)}"
        self.client.post(f"/api/habits/{habit_id}/check-in", headers=self.headers)

    @task(2)
    def get_goals(self):
        """Get user goals"""
        self.client.get("/api/goals", headers=self.headers)

    @task(1)
    def get_analytics_dashboard(self):
        """Get dashboard analytics"""
        self.client.get("/api/analytics/dashboard?period=30d", headers=self.headers)

    @task(1)
    def get_tasks(self):
        """Get user tasks"""
        self.client.get("/api/tasks", headers=self.headers)

    @task(1)
    def ai_coaching(self):
        """Request AI coaching advice"""
        self.client.post("/api/ai/coaching",
            headers=self.headers,
            json={
                "message": "How can I improve my productivity?",
                "context": {}
            }
        )

    @task(1)
    def create_habit(self):
        """Create a new habit"""
        self.client.post("/api/habits",
            headers=self.headers,
            json={
                "name": f"Load Test Habit {random.randint(1, 1000)}",
                "description": "Load testing habit creation",
                "frequency": random.choice(["daily", "weekly"])
            }
        )

class AdminUser(HttpUser):
    """Admin panel operations"""
    wait_time = between(2, 5)
    weight = 1  # 10% of total load

    def on_start(self):
        """Admin login"""
        response = self.client.post("/api/auth/login", json={
            "email": "admin@upcoach.com",
            "password": "AdminPassword123!"
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_analytics(self):
        """View platform analytics"""
        self.client.get("/api/analytics/platform", headers=self.headers)

    @task(2)
    def get_users_list(self):
        """View users list"""
        self.client.get("/api/users?page=1&limit=50", headers=self.headers)

    @task(1)
    def get_monitoring_metrics(self):
        """View monitoring metrics"""
        self.client.get("/api/monitoring/metrics", headers=self.headers)

    @task(1)
    def get_financial_reports(self):
        """View financial reports"""
        self.client.get("/api/financial/reports", headers=self.headers)

class MobileUser(HttpUser):
    """Mobile app sync operations"""
    wait_time = between(5, 15)
    weight = 2  # 20% of total load

    def on_start(self):
        """Mobile device authentication"""
        response = self.client.post("/api/auth/login", json={
            "email": f"mobile+{random.randint(1, 5000)}@upcoach.com",
            "password": "MobilePassword123!",
            "deviceId": f"device-{random.randint(1, 10000)}"
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(5)
    def sync_data(self):
        """Mobile data sync"""
        self.client.post("/api/sync/pull",
            headers=self.headers,
            json={
                "lastSyncAt": "2025-01-20T00:00:00Z",
                "deviceId": f"device-{random.randint(1, 10000)}"
            }
        )

    @task(2)
    def push_changes(self):
        """Push local changes to server"""
        self.client.post("/api/sync/push",
            headers=self.headers,
            json={
                "changes": [
                    {
                        "type": "habit_check_in",
                        "habitId": f"habit-{random.randint(1, 100)}",
                        "timestamp": "2025-01-26T12:00:00Z"
                    }
                ]
            }
        )
