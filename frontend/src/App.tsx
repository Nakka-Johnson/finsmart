import { useState, useEffect } from 'react'
import './App.css'

interface HealthStatus {
  backend: { status: string; text: string };
  ai: { status: string; text: string };
}

interface InsightResult {
  summary: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus>({
    backend: { status: 'checking', text: 'Checking...' },
    ai: { status: 'checking', text: 'Checking...' }
  });
  const [insightResult, setInsightResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    // Check Backend
    try {
      const backendRes = await fetch('http://localhost:8081/api/health');
      const backendText = await backendRes.text();
      setHealth(prev => ({
        ...prev,
        backend: {
          status: backendRes.ok ? 'ok' : 'error',
          text: backendText || 'Backend unreachable'
        }
      }));
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        backend: { status: 'error', text: 'Backend unreachable' }
      }));
    }

    // Check AI
    try {
      const aiRes = await fetch('http://127.0.0.1:8001/health');
      const aiData = await aiRes.json();
      setHealth(prev => ({
        ...prev,
        ai: {
          status: aiRes.ok ? 'ok' : 'error',
          text: aiData.status || 'AI service error'
        }
      }));
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        ai: { status: 'error', text: 'AI service unreachable' }
      }));
    }
  };

  const runSampleInsight = async () => {
    setLoading(true);
    setInsightResult('');
    
    const sampleData = {
      transactions: [
        { date: '2025-01-01', amount: 100.50, category: 'Food' },
        { date: '2025-01-02', amount: 50.0, category: 'Transport' },
        { date: '2025-01-03', amount: 75.25, category: 'Shopping' }
      ]
    };

    try {
      const res = await fetch('http://localhost:8081/api/insights/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data: InsightResult = await res.json();
      setInsightResult(data.summary);
    } catch (error) {
      setInsightResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>FinSmart Dashboard</h1>
      
      {/* Health Status Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>System Health</h2>
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div>
            <strong>Backend: </strong>
            <span style={{ color: health.backend.status === 'ok' ? 'green' : 'red' }}>
              {health.backend.text}
            </span>
          </div>
          <div>
            <strong>AI Service: </strong>
            <span style={{ color: health.ai.status === 'ok' ? 'green' : 'red' }}>
              {health.ai.text}
            </span>
          </div>
        </div>
        <button 
          onClick={checkHealth}
          style={{ 
            marginTop: '15px', 
            padding: '8px 16px', 
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#f0f0f0'
          }}
        >
          Refresh Status
        </button>
      </div>

      {/* AI Insights Section */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>AI Insights</h2>
        <button 
          onClick={runSampleInsight}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none',
            borderRadius: '4px',
            background: loading ? '#ccc' : '#007bff',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Analyzing...' : 'Run Sample Insight'}
        </button>
        
        {insightResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '14px', color: '#666' }}>Analysis Result:</h3>
            <p style={{ margin: 0, fontSize: '16px' }}>{insightResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
