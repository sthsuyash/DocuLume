"""Load tests with Locust."""
from locust import HttpUser, task, between

class ChatPDFUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def health_check(self):
        self.client.get("/api/v1/health/ready")

    @task(3)
    def list_documents(self):
        headers = {"Authorization": "Bearer test-token"}
        self.client.get("/api/v1/documents/", headers=headers)
