from locust import HttpUser, task


class GoalUser(HttpUser):
    @task
    def dashboard(self):
        self.client.get('/dashboard', params={'requester_id': 2, 'range': 'monthly'})