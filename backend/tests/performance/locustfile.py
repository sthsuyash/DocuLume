"""Load tests with Locust.

Run:
    locust -f tests/performance/locustfile.py --host=http://localhost:8000

For headless CI:
    locust -f tests/performance/locustfile.py --host=http://localhost:8000 \
        --users=50 --spawn-rate=5 --run-time=2m --headless
"""
import random
import string
from io import BytesIO
from locust import HttpUser, task, between


def _random_email():
    suffix = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"loadtest_{suffix}@example.com"


class UnauthenticatedUser(HttpUser):
    """Simulates anonymous traffic — health checks and landing page hits."""

    wait_time = between(1, 3)
    weight = 2

    @task(5)
    def health_ready(self):
        self.client.get("/api/v1/health/ready", name="/health/ready")

    @task(1)
    def health_detailed(self):
        self.client.get("/api/v1/health/detailed", name="/health/detailed")


class AuthenticatedUser(HttpUser):
    """Simulates a logged-in user performing typical document + chat operations."""

    wait_time = between(2, 5)
    weight = 8

    def on_start(self):
        """Register and login before running tasks."""
        self.email = _random_email()
        self.password = "LoadTest123!@#"

        self.client.post("/api/v1/auth/register", json={
            "email": self.email,
            "username": self.email.split("@")[0],
            "password": self.password,
            "full_name": "Load Test User",
        }, name="/auth/register")

        self.client.post("/api/v1/auth/login", json={
            "email": self.email,
            "password": self.password,
        }, name="/auth/login")

    def on_stop(self):
        self.client.post("/api/v1/auth/logout", name="/auth/logout")

    @task(5)
    def list_documents(self):
        self.client.get("/api/v1/documents/", name="/documents/ (list)")

    @task(3)
    def search_documents(self):
        self.client.get(
            "/api/v1/documents/?search=test",
            name="/documents/ (search)",
        )

    @task(2)
    def upload_small_document(self):
        # Minimal valid PDF bytes
        pdf = BytesIO(b"%PDF-1.4\n1 0 obj\n<</Type /Catalog>>\nendobj\nxref\n0 2\ntrailer\n<<>>\nstartxref\n9\n%%EOF")
        self.client.post(
            "/api/v1/documents/upload",
            files={"file": ("load_test.pdf", pdf, "application/pdf")},
            name="/documents/upload",
        )

    @task(4)
    def get_current_user(self):
        self.client.get("/api/v1/auth/me", name="/auth/me")

    @task(1)
    def refresh_token(self):
        self.client.post("/api/v1/auth/refresh", name="/auth/refresh")
