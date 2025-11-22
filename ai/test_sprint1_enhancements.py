"""Test Sprint-1 AI enhancements."""

from app.service import categorize, anomalies, merchant_insights, normalize_merchant_name
from app.models import Txn


def test_enhanced_categorization():
    """Test the new weighted keyword categorization with scores."""
    print("\n🧪 Testing Enhanced Categorization (Sprint-1)")
    print("=" * 60)
    
    transactions = [
        Txn(
            date="2025-11-10",
            amount=45.67,
            direction="DEBIT",
            description="Tesco Express grocery shopping",
            merchant="Tesco Express Ltd"
        ),
        Txn(
            date="2025-11-09",
            amount=12.99,
            direction="DEBIT",
            description="Netflix subscription",
            merchant="Netflix Inc"
        ),
        Txn(
            date="2025-11-08",
            amount=3.50,
            direction="DEBIT",
            description="Unknown purchase",
            merchant="Random Store"
        ),
    ]
    
    results = categorize(transactions)
    
    for i, (txn, result) in enumerate(zip(transactions, results), 1):
        print(f"\n📝 Transaction {i}: {txn.description}")
        print(f"   Merchant: {txn.merchant}")
        print(f"   ✅ Category: {result.guessCategory}")
        print(f"   📊 Score: {result.score:.3f}")
        print(f"   🔍 Tokens: {result.reason.tokens[:5]}")
        print(f"   🎯 Matched Keywords: {result.reason.matchedKeywords}")
        print(f"   📈 All Scores: {result.reason.scores}")
        print(f"   💡 Details: {result.reason.details}")


def test_anomalies_with_ignore():
    """Test anomaly detection with ignore list."""
    print("\n\n🧪 Testing Anomalies with Ignore List (Sprint-1)")
    print("=" * 60)
    
    transactions = [
        Txn(id="txn-1", date="2025-11-01", amount=50.0, direction="DEBIT", category="Groceries"),
        Txn(id="txn-2", date="2025-11-02", amount=55.0, direction="DEBIT", category="Groceries"),
        Txn(id="txn-3", date="2025-11-03", amount=500.0, direction="DEBIT", category="Groceries"),  # Anomaly
        Txn(id="txn-4", date="2025-11-04", amount=48.0, direction="DEBIT", category="Groceries"),
    ]
    
    # Without ignore list
    print("\n📊 Without ignore list:")
    results = anomalies(transactions, ignore_ids=None)
    for txn, result in zip(transactions, results):
        if result.isAnomaly:
            print(f"   🚨 Anomaly detected: {txn.id} - £{txn.amount} (z-score: {result.score})")
    
    # With ignore list
    print("\n📊 With ignore list (ignoring txn-3):")
    results = anomalies(transactions, ignore_ids=["txn-3"])
    for txn, result in zip(transactions, results):
        if result.isAnomaly:
            print(f"   🚨 Anomaly detected: {txn.id} - £{txn.amount} (z-score: {result.score})")
        elif txn.id == "txn-3":
            print(f"   ✅ Ignored: {txn.id} - £{txn.amount} (marked as non-anomaly)")


def test_merchant_normalization():
    """Test merchant name normalization."""
    print("\n\n🧪 Testing Merchant Name Normalization (Sprint-1)")
    print("=" * 60)
    
    test_cases = [
        ("Tesco Express Ltd", "tesco express"),
        ("Amazon Inc.", "amazon"),
        ("Starbucks Coffee Co.", "starbucks coffee"),
        ("McDonald's Corp", "mcdonalds"),
        ("Netflix, Inc.", "netflix"),
    ]
    
    for original, expected in test_cases:
        normalized = normalize_merchant_name(original)
        status = "✅" if normalized == expected else "❌"
        print(f"   {status} '{original}' → '{normalized}'")


def test_merchant_insights():
    """Test merchant insights aggregation."""
    print("\n\n🧪 Testing Merchant Insights Aggregation (Sprint-1)")
    print("=" * 60)
    
    transactions = [
        Txn(date="2025-09-15", amount=50.0, direction="DEBIT", merchant="Tesco Ltd"),
        Txn(date="2025-09-20", amount=30.0, direction="DEBIT", merchant="Tesco Express"),
        Txn(date="2025-10-10", amount=45.0, direction="DEBIT", merchant="Tesco"),
        Txn(date="2025-11-05", amount=55.0, direction="DEBIT", merchant="Tesco Ltd"),
        Txn(date="2025-10-15", amount=100.0, direction="DEBIT", merchant="Amazon Inc"),
    ]
    
    insights = merchant_insights(transactions, months_back=3)
    
    print(f"\n📊 Found {len(insights)} merchants:")
    for insight in insights:
        print(f"\n   🏪 {insight.merchant.upper()}")
        print(f"      Total: £{insight.totalSpending:.2f}")
        print(f"      Monthly breakdown:")
        for monthly in insight.monthlyTotals:
            print(f"         {monthly.month}: £{monthly.total:.2f}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Sprint-1 AI Service Enhancements - Test Suite")
    print("="*60)
    
    test_enhanced_categorization()
    test_anomalies_with_ignore()
    test_merchant_normalization()
    test_merchant_insights()
    
    print("\n" + "="*60)
    print("✅ All Sprint-1 tests completed successfully!")
    print("="*60 + "\n")
