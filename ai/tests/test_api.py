"""API endpoint tests for FinSmart AI service using TestClient."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client for FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for /health endpoint."""

    def test_health_returns_ok_status(self, client):
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ai ok"
        assert "version" in data

    def test_health_includes_model_info(self, client):
        response = client.get("/health")

        data = response.json()
        assert "models_loaded" in data
        assert isinstance(data["models_loaded"], bool)


class TestCategorizeEndpoint:
    """Tests for /categorize endpoint - real ML inference."""

    def test_categorize_grocery_transaction(self, client):
        payload = {
            "transactions": [
                {"description": "TESCO GROCERIES LONDON", "amount": 45.50, "date": "2026-01-15", "direction": "DEBIT"}
            ]
        }

        response = client.post("/categorize", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 1

        prediction = data["predictions"][0]
        assert "guessCategory" in prediction
        assert "score" in prediction
        assert 0 <= prediction["score"] <= 1

    def test_categorize_transport_transaction(self, client):
        payload = {
            "transactions": [
                {"description": "TFL TRAVEL CHARGE LONDON", "amount": 8.90, "date": "2026-01-15", "direction": "DEBIT"}
            ]
        }

        response = client.post("/categorize", json=payload)

        assert response.status_code == 200
        prediction = response.json()["predictions"][0]

        # Transport keywords should trigger Transport or Travel category
        assert prediction["guessCategory"] in ["Transport", "Travel", None]

    def test_categorize_multiple_transactions(self, client):
        payload = {
            "transactions": [
                {"description": "SAINSBURYS SUPERMARKET", "amount": 32.00, "date": "2026-01-15", "direction": "DEBIT"},
                {"description": "UBER TRIP", "amount": 15.50, "date": "2026-01-14", "direction": "DEBIT"},
                {"description": "NETFLIX SUBSCRIPTION", "amount": 15.99, "date": "2026-01-13", "direction": "DEBIT"},
            ]
        }

        response = client.post("/categorize", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data["predictions"]) == 3

    def test_categorize_empty_list_returns_error(self, client):
        """Empty transaction list should return validation error (min_length=1)."""
        payload = {"transactions": []}

        response = client.post("/categorize", json=payload)

        # API requires at least 1 transaction
        assert response.status_code == 422


class TestAnalyzeEndpoint:
    """Tests for /analyze endpoint - spending summary."""

    def test_analyze_returns_summary(self, client):
        payload = {
            "transactions": [
                {"description": "TESCO", "amount": 50.00, "direction": "DEBIT", "date": "2026-01-15"},
                {"description": "SALARY", "amount": 2000.00, "direction": "CREDIT", "date": "2026-01-01"},
                {"description": "RENT", "amount": 800.00, "direction": "DEBIT", "date": "2026-01-05"},
            ]
        }

        response = client.post("/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert "totalDebit" in data
        assert "totalCredit" in data
        assert data["totalDebit"] == 850.00
        assert data["totalCredit"] == 2000.00

    def test_analyze_includes_category_breakdown(self, client):
        payload = {
            "transactions": [
                {"description": "TESCO GROCERIES", "amount": 50.00, "direction": "DEBIT", "date": "2026-01-15"},
            ]
        }

        response = client.post("/analyze", json=payload)

        data = response.json()
        assert "topCategories" in data
