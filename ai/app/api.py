"""API routes for FinSmart AI service."""

from fastapi import APIRouter
from app.models import (
    AnalyzeRequest,
    AnomalyRequest,
    MerchantInsightRequest,
    SummaryResponse,
    CategorizeResponse,
    AnomalyResponse,
    ForecastResponse,
    MerchantInsightResponse,
    HealthResponse,
)
from app import service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ai ok")


@router.post("/analyze", response_model=SummaryResponse, tags=["insights"])
def analyze(req: AnalyzeRequest) -> SummaryResponse:
    """
    Analyze transactions and generate spending summary.

    Args:
        req: Request containing list of transactions

    Returns:
        Summary with total debit/credit, biggest category, top 5 categories
    """
    result = service.summarize(req.transactions)
    return SummaryResponse(**result)


@router.post("/categorize", response_model=CategorizeResponse, tags=["insights"])
def categorize(req: AnalyzeRequest) -> CategorizeResponse:
    """
    Categorize transactions using weighted keyword matching with TF-IDF-like scoring.
    
    Returns detailed predictions with:
    - guessCategory: Best category above threshold
    - score: Normalized confidence score (0-1)
    - reason: Detailed explanation with matched tokens, keywords, and scores

    Args:
        req: Request containing list of transactions

    Returns:
        List of category predictions with scores and detailed reasons (aligned by index)
    """
    guesses = service.categorize(req.transactions)
    return CategorizeResponse(predictions=guesses)


@router.post("/anomalies", response_model=AnomalyResponse, tags=["insights"])
def anomalies(req: AnomalyRequest) -> AnomalyResponse:
    """
    Detect anomalies in transactions using z-score analysis.
    
    Supports optional ignore list for snoozing/confirming anomalies.

    Args:
        req: Request containing list of transactions and optional ignoreIds

    Returns:
        List of anomaly detection results (aligned by index)
    """
    results = service.anomalies(req.transactions, req.ignoreIds)
    return AnomalyResponse(anomalies=results)


@router.post("/forecast", response_model=ForecastResponse, tags=["insights"])
def forecast(req: AnalyzeRequest) -> ForecastResponse:
    """
    Forecast next month spending by category using simple methods.

    Args:
        req: Request containing list of transactions

    Returns:
        List of forecasts per category with method used
    """
    forecasts = service.forecast(req.transactions)
    return ForecastResponse(forecasts=forecasts)


@router.post("/merchant-insights", response_model=MerchantInsightResponse, tags=["insights"])
def merchant_insights(req: MerchantInsightRequest) -> MerchantInsightResponse:
    """
    Aggregate spending by merchant with monthly breakdown.
    
    Normalizes merchant names (case-folding, suffix removal) and provides
    monthly totals for the last N months.

    Args:
        req: Request containing transactions and monthsBack parameter

    Returns:
        List of merchant insights sorted by total spending (descending)
    """
    insights = service.merchant_insights(req.transactions, req.monthsBack)
    return MerchantInsightResponse(merchants=insights)
