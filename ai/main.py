from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Literal

app = FastAPI(title="FinSmart AI")

class Txn(BaseModel):
    date: str = Field(..., description="ISO date")
    amount: float = Field(..., ge=0)
    category: str

class AnalyzeRequest(BaseModel):
    transactions: List[Txn]

@app.get("/health")
def health():
    return {"status": "ai ok"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    total = sum(t.amount for t in req.transactions)
    by_cat = {}
    for t in req.transactions:
        by_cat[t.category] = by_cat.get(t.category, 0) + t.amount
    biggest = max(by_cat, key=by_cat.get) if by_cat else None
    return {"summary": f"Total spent £{total:.2f}. Biggest category: {biggest}"}
