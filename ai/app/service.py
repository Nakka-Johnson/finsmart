"""Core analytics and insights service logic."""

from collections import defaultdict
from datetime import datetime
import statistics
import re
import math
from app.models import (
    Txn,
    CategoryGuess,
    CategoryReason,
    TopCategory,
    ForecastItem,
    AnomalyItem,
    MerchantInsight,
    MerchantMonthly,
)


# Category keywords with weights (higher = more important)
CATEGORY_KEYWORDS = {
    "Groceries": {
        "grocery": 3.0,
        "supermarket": 3.0,
        "tesco": 2.5,
        "asda": 2.5,
        "aldi": 2.5,
        "sainsbury": 2.5,
        "morrisons": 2.5,
        "food": 2.0,
        "market": 1.5,
        "whole foods": 2.0,
        "trader joe": 2.0,
        "safeway": 2.0,
        "kroger": 2.0,
    },
    "Transport": {
        "gas": 2.0,
        "fuel": 2.0,
        "uber": 3.0,
        "lyft": 3.0,
        "bolt": 3.0,
        "taxi": 2.5,
        "transit": 2.5,
        "metro": 2.5,
        "merseyrail": 2.5,
        "tfl": 2.5,
        "stagecoach": 2.5,
        "parking": 2.0,
        "shell": 1.5,
        "chevron": 1.5,
    },
    "Rent": {
        "rent": 3.0,
        "lease": 2.5,
        "landlord": 2.5,
        "lettings": 2.5,
        "property management": 2.0,
    },
    "Utilities": {
        "electric": 2.5,
        "electricity": 2.5,
        "water": 2.5,
        "gas bill": 2.5,
        "utility": 2.5,
        "internet": 2.0,
        "phone": 2.0,
        "wireless": 2.0,
        "verizon": 2.0,
        "at&t": 2.0,
        "octopus": 2.5,
        "british gas": 2.5,
        "edf": 2.5,
        "eon": 2.5,
        "ovo": 2.5,
        "united utilities": 2.5,
    },
    "Entertainment": {
        "movie": 2.0,
        "netflix": 3.0,
        "spotify": 3.0,
        "prime": 2.5,
        "itunes": 2.5,
        "game": 1.5,
        "concert": 2.0,
        "theater": 2.0,
        "entertainment": 2.0,
    },
    "Dining": {
        "restaurant": 2.5,
        "cafe": 2.0,
        "coffee": 2.0,
        "starbucks": 2.5,
        "mcdonald": 2.5,
        "burger": 2.0,
        "pizza": 2.0,
        "dining": 2.0,
        "takeaway": 2.0,
        "delivery": 1.5,
    },
    "Health": {
        "pharmacy": 2.5,
        "hospital": 2.5,
        "doctor": 2.5,
        "medical": 2.5,
        "health": 2.0,
        "clinic": 2.0,
        "prescription": 2.0,
        "dentist": 2.5,
    },
    "Shopping": {
        "amazon": 2.5,
        "ebay": 2.5,
        "walmart": 2.5,
        "target": 2.5,
        "clothing": 2.0,
        "store": 1.5,
        "shop": 1.5,
        "retail": 1.5,
    },
}


def summarize(transactions: list[Txn]) -> dict:
    """
    Compute spending summary.
    
    Returns:
        - totalDebit: sum of all DEBIT transactions
        - totalCredit: sum of all CREDIT transactions
        - biggestCategory: category with highest debit spending
        - topCategories: top 5 categories by debit spending
    """
    total_debit = 0.0
    total_credit = 0.0
    category_debits = defaultdict(float)
    
    for txn in transactions:
        if txn.direction == "DEBIT":
            total_debit += txn.amount
            if txn.category:
                category_debits[txn.category] += txn.amount
        elif txn.direction == "CREDIT":
            total_credit += txn.amount
    
    # Find biggest category
    biggest_category = None
    if category_debits:
        biggest_category = max(category_debits.items(), key=lambda x: x[1])[0]
    
    # Top 5 categories
    top_categories = sorted(category_debits.items(), key=lambda x: x[1], reverse=True)[:5]
    top_categories_list = [
        TopCategory(category=cat, total=total) for cat, total in top_categories
    ]
    
    return {
        "totalDebit": total_debit,
        "totalCredit": total_credit,
        "biggestCategory": biggest_category,
        "topCategories": top_categories_list,
    }


def categorize(transactions: list[Txn]) -> list[CategoryGuess]:
    """
    Categorize transactions using weighted keyword matching with TF-IDF-like scoring.
    
    For each transaction:
    1. Tokenize description and merchant
    2. Compute score for each category based on keyword matches and weights
    3. Select category with highest score above threshold (0.5)
    4. Return detailed explanation with matched tokens and scores
    
    Returns list aligned by transaction index.
    """
    THRESHOLD = 0.5  # Minimum score to assign a category
    results = []
    
    for txn in transactions:
        # Build search text from description and merchant
        search_text = ""
        if txn.description:
            search_text += txn.description.lower() + " "
        if txn.merchant:
            search_text += txn.merchant.lower()
        
        # Tokenize: split by non-alphanumeric, keep words 2+ chars
        tokens = [token for token in re.findall(r'\b\w{2,}\b', search_text)]
        
        # Compute score for each category
        category_scores = {}
        matched_keywords = {}
        
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = 0.0
            matched = []
            
            for keyword, weight in keywords.items():
                # Check if keyword appears in search text
                # Use word boundaries for better matching
                if re.search(r'\b' + re.escape(keyword.replace(' ', r'\s+')) + r'\b', search_text):
                    # TF-IDF-like: weight * (1 + log(term frequency))
                    # Count occurrences
                    tf = search_text.count(keyword.lower())
                    score += weight * (1 + math.log(tf + 1))
                    matched.append(keyword)
            
            if score > 0:
                category_scores[category] = round(score, 2)
                matched_keywords[category] = matched
        
        # Select best category
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            best_cat_name, best_score = best_category
            
            if best_score >= THRESHOLD:
                # Normalize score to 0-1 range (divide by max possible score ~15)
                normalized_score = min(best_score / 15.0, 1.0)
                
                results.append(
                    CategoryGuess(
                        guessCategory=best_cat_name,
                        score=round(normalized_score, 3),
                        reason=CategoryReason(
                            tokens=tokens[:10],  # First 10 tokens
                            matchedKeywords=matched_keywords.get(best_cat_name, []),
                            scores=category_scores,
                            details=f"Matched {len(matched_keywords.get(best_cat_name, []))} keyword(s) with score {best_score:.2f}"
                        )
                    )
                )
            else:
                # Below threshold
                results.append(
                    CategoryGuess(
                        guessCategory="Uncategorized",
                        score=0.0,
                        reason=CategoryReason(
                            tokens=tokens[:10],
                            matchedKeywords=[],
                            scores=category_scores,
                            details=f"Best score {best_score:.2f} below threshold {THRESHOLD}"
                        )
                    )
                )
        else:
            # No matches at all
            results.append(
                CategoryGuess(
                    guessCategory="Uncategorized",
                    score=0.0,
                    reason=CategoryReason(
                        tokens=tokens[:10],
                        matchedKeywords=[],
                        scores={},
                        details="No matching keywords found"
                    )
                )
            )
    
    return results


def anomalies(transactions: list[Txn], ignore_ids: list[str] | None = None) -> list[AnomalyItem]:
    """
    Detect anomalies using z-score within each category's debit amounts.
    
    Args:
        transactions: List of transactions to analyze
        ignore_ids: Optional list of transaction IDs to ignore (snooze/confirm)
    
    Flag transactions with |z-score| >= 2 as anomalies.
    """
    ignore_set = set(ignore_ids or [])
    
    # Group debit transactions by category (excluding ignored)
    category_amounts = defaultdict(list)
    
    for txn in transactions:
        if txn.direction == "DEBIT" and (txn.id is None or txn.id not in ignore_set):
            category_amounts[txn.category or "Uncategorized"].append(txn)
    
    results = []
    
    for txn in transactions:
        # Skip ignored transactions
        if txn.id and txn.id in ignore_set:
            results.append(
                AnomalyItem(
                    date=txn.date,
                    amount=txn.amount,
                    category=txn.category,
                    score=0.0,
                    isAnomaly=False
                )
            )
            continue
        
        if txn.direction != "DEBIT":
            # Only analyze debits
            results.append(
                AnomalyItem(
                    date=txn.date,
                    amount=txn.amount,
                    category=txn.category,
                    score=0.0,
                    isAnomaly=False
                )
            )
            continue
        
        category = txn.category or "Uncategorized"
        amounts_in_category = [t.amount for t in category_amounts[category]]
        
        # Need at least 3 transactions to compute meaningful z-score
        if len(amounts_in_category) < 3:
            results.append(
                AnomalyItem(
                    date=txn.date,
                    amount=txn.amount,
                    category=txn.category,
                    score=0.0,
                    isAnomaly=False
                )
            )
            continue
        
        # Compute z-score
        mean = statistics.mean(amounts_in_category)
        stdev = statistics.stdev(amounts_in_category)
        
        if stdev == 0:
            z_score = 0.0
        else:
            z_score = (txn.amount - mean) / stdev
        
        is_anomaly = abs(z_score) >= 2.0
        
        results.append(
            AnomalyItem(
                date=txn.date,
                amount=txn.amount,
                category=txn.category,
                score=round(z_score, 2),
                isAnomaly=is_anomaly
            )
        )
    
    return results


def forecast(transactions: list[Txn]) -> list[ForecastItem]:
    """
    Forecast next month spending by category using simple methods.
    
    Methods:
    - SMA3: 3-month simple moving average
    - lastValue: Use last month's value if not enough data
    """
    # Group debit transactions by category and month
    category_monthly = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        if txn.direction == "DEBIT":
            try:
                # Extract YYYY-MM from date
                month = txn.date[:7]  # "2025-01-15" -> "2025-01"
                category = txn.category or "Uncategorized"
                category_monthly[category][month] += txn.amount
            except (ValueError, IndexError):
                continue
    
    forecasts = []
    
    for category, monthly_data in category_monthly.items():
        # Sort months chronologically
        sorted_months = sorted(monthly_data.items())
        
        if len(sorted_months) == 0:
            continue
        
        amounts = [amount for _, amount in sorted_months]
        
        # Use SMA3 if we have at least 3 months
        if len(amounts) >= 3:
            last_three = amounts[-3:]
            predicted = statistics.mean(last_three)
            method = "SMA3"
        else:
            # Use last value
            predicted = amounts[-1]
            method = "lastValue"
        
        forecasts.append(
            ForecastItem(
                category=category,
                nextMonthForecast=round(predicted, 2),
                method=method
            )
        )
    
    return forecasts


def normalize_merchant_name(merchant: str) -> str:
    """
    Normalize merchant name for aggregation.
    
    Steps:
    1. Convert to lowercase
    2. Remove common suffixes (ltd, inc, llc, plc, limited, corp)
    3. Trim whitespace
    4. Remove special characters except spaces
    """
    if not merchant:
        return "Unknown"
    
    # Lowercase
    name = merchant.lower().strip()
    
    # Remove common business suffixes
    suffixes = [
        r'\s+ltd\.?$',
        r'\s+inc\.?$',
        r'\s+llc\.?$',
        r'\s+plc\.?$',
        r'\s+limited$',
        r'\s+corp\.?$',
        r'\s+co\.?$',
    ]
    
    for suffix in suffixes:
        name = re.sub(suffix, '', name, flags=re.IGNORECASE)
    
    # Remove special characters except spaces
    name = re.sub(r'[^\w\s]', '', name)
    
    # Collapse multiple spaces
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name if name else "Unknown"


def merchant_insights(transactions: list[Txn], months_back: int = 3) -> list[MerchantInsight]:
    """
    Aggregate transactions by merchant with monthly breakdown.
    
    Args:
        transactions: List of transactions to aggregate
        months_back: Number of months to include (default 3)
    
    Returns:
        List of merchant insights with monthly totals
    """
    from datetime import datetime, timedelta
    
    # Calculate cutoff date
    today = datetime.now()
    cutoff_date = (today - timedelta(days=months_back * 30)).strftime("%Y-%m-%d")
    
    # Group by normalized merchant and month
    merchant_monthly = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        # Only process DEBIT transactions within date range
        if txn.direction != "DEBIT" or txn.date < cutoff_date:
            continue
        
        merchant = normalize_merchant_name(txn.merchant)
        
        try:
            month = txn.date[:7]  # "2025-01-15" -> "2025-01"
            merchant_monthly[merchant][month] += txn.amount
        except (ValueError, IndexError):
            continue
    
    # Build response
    insights = []
    
    for merchant, monthly_data in merchant_monthly.items():
        monthly_totals = []
        total_spending = 0.0
        
        for month, amount in sorted(monthly_data.items()):
            monthly_totals.append(
                MerchantMonthly(month=month, total=round(amount, 2))
            )
            total_spending += amount
        
        insights.append(
            MerchantInsight(
                merchant=merchant,
                monthlyTotals=monthly_totals,
                totalSpending=round(total_spending, 2)
            )
        )
    
    # Sort by total spending (descending)
    insights.sort(key=lambda x: x.totalSpending, reverse=True)
    
    return insights
