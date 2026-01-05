/**
 * Dashboard - Truthful UI Pass
 * 
 * Shows real data from the insights summary API.
 * Displays proper empty states when no data exists.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth';
import { insightApi, demoApi } from '@/api/endpoints';
import { currencyGBP, formatDate } from '@/utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { InsightsSummaryResponse, DateRange } from '@/api/types';
import './Dashboard.css';

interface HealthStatus {
  backend: 'UP' | 'DOWN' | 'CHECKING';
  ai: 'UP' | 'DOWN' | 'CHECKING';
}

export function Dashboard() {
  const { showToast } = useToast();
  const { token } = useAuthStore();

  // State
  const [health, setHealth] = useState<HealthStatus>({ backend: 'CHECKING', ai: 'CHECKING' });
  const [summary, setSummary] = useState<InsightsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('LAST_30_DAYS');
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/api/health`);
      setHealth(prev => ({ ...prev, backend: response.ok ? 'UP' : 'DOWN' }));
    } catch {
      setHealth(prev => ({ ...prev, backend: 'DOWN' }));
    }

    try {
      const aiUrl = import.meta.env.VITE_AI_URL || 'http://127.0.0.1:8001';
      const response = await fetch(`${aiUrl}/health`);
      setHealth(prev => ({ ...prev, ai: response.ok ? 'UP' : 'DOWN' }));
    } catch {
      setHealth(prev => ({ ...prev, ai: 'DOWN' }));
    }
  }, []);

  // Load summary data
  const loadSummary = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await insightApi.summary(range, token);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, range, showToast]);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadSummary();
  }, [checkHealth, loadSummary]);

  // Seed demo data
  const handleSeedDemo = async () => {
    if (!token) return;
    setSeedingDemo(true);
    try {
      const result = await demoApi.seedUk(token);
      showToast(`Demo data created: ${result.transactionsCreated} transactions`, 'success');
      loadSummary();
    } catch (err) {
      console.error('Failed to seed demo:', err);
      showToast('Failed to load demo data', 'error');
    } finally {
      setSeedingDemo(false);
    }
  };

  // Check if we have data
  const hasData = summary && summary.transactionCount > 0;

  // Format currency for tooltips
  const formatTooltipValue = (value: number) => currencyGBP(value);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-health">
          <div className={`status-chip status-${health.backend.toLowerCase()}`}>
            Backend: {health.backend}
          </div>
          <div className={`status-chip status-${health.ai.toLowerCase()}`}>
            AI: {health.ai}
          </div>
        </div>
      </header>

      {/* Date range selector */}
      <div className="dashboard-controls">
        <select
          value={range}
          onChange={e => setRange(e.target.value as DateRange)}
          className="range-select"
        >
          <option value="LAST_30_DAYS">Last 30 Days</option>
          <option value="LAST_6_MONTHS">Last 6 Months</option>
        </select>
        <button onClick={loadSummary} className="btn btn-secondary" disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Loader size="large" />
          <p>Loading your financial data...</p>
        </div>
      ) : !hasData ? (
        /* Empty state with CTAs */
        <EmptyState
          onSeedDemo={handleSeedDemo}
          seedingDemo={seedingDemo}
        />
      ) : (
        /* Dashboard with real data */
        <>
          {/* Summary cards */}
          <div className="dashboard-stats">
            <Card className="stat-card">
              <div className="stat-label">Current Balance</div>
              <div className="stat-value balance">
                {currencyGBP(summary.currentBalance)}
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-label">Income</div>
              <div className="stat-value income">
                {currencyGBP(summary.totalIncome)}
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-label">Spending</div>
              <div className="stat-value spending">
                {currencyGBP(summary.totalSpending)}
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-label">Net Flow</div>
              <div className={`stat-value ${summary.netFlow >= 0 ? 'income' : 'spending'}`}>
                {currencyGBP(summary.netFlow)}
              </div>
            </Card>
          </div>

          {/* Change narratives */}
          {summary.changeNarrative.length > 0 && (
            <Card title="Insights" className="narratives-card">
              <ul className="narratives-list">
                {summary.changeNarrative.map((item, idx) => (
                  <li key={idx} className="narrative-item">
                    <span className="narrative-label">{item.label}:</span>
                    <span className="narrative-note">{item.note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="dashboard-grid">
            {/* Spending by category */}
            {summary.spendByCategory.length > 0 && (
              <Card title="Spending by Category" className="chart-card">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={summary.spendByCategory}
                    layout="vertical"
                    margin={{ left: 80, right: 20 }}
                  >
                    <XAxis type="number" tickFormatter={v => currencyGBP(v)} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {summary.spendByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Top merchants */}
            {summary.topMerchants.length > 0 && (
              <Card title="Top Merchants" className="merchants-card">
                <table className="merchants-table">
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Total</th>
                      <th>Txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topMerchants.slice(0, 5).map((m, idx) => (
                      <tr key={idx}>
                        <td>{m.merchantName}</td>
                        <td className="amount">{currencyGBP(m.total)}</td>
                        <td className="count">{m.txCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/insights" className="view-all-link">
                  View all merchants →
                </Link>
              </Card>
            )}
          </div>

          {/* Anomalies preview */}
          {summary.anomaliesPreview.length > 0 && (
            <Card title="Flagged Transactions" className="anomalies-card">
              <ul className="anomalies-list">
                {summary.anomaliesPreview.map((a, idx) => (
                  <li key={idx} className="anomaly-item">
                    <div className="anomaly-merchant">{a.merchantName}</div>
                    <div className="anomaly-amount">{currencyGBP(a.amount)}</div>
                    <div className="anomaly-reason">{a.reason}</div>
                    <div className={`anomaly-score score-${a.score >= 0.9 ? 'high' : a.score >= 0.8 ? 'medium' : 'low'}`}>
                      {(a.score * 100).toFixed(0)}%
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Transaction count footer */}
          <div className="dashboard-footer">
            <span className="tx-count">
              Based on {summary.transactionCount} transactions from{' '}
              {formatDate(summary.periodStart)} to {formatDate(summary.periodEnd)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Empty state component with CTAs
 */
function EmptyState({ 
  onSeedDemo, 
  seedingDemo 
}: { 
  onSeedDemo: () => void; 
  seedingDemo: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-empty">
      <div className="empty-icon">📊</div>
      <h2>No transactions yet</h2>
      <p>Import your transactions or load demo data to see your financial insights.</p>
      
      <div className="empty-actions">
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/import')}
        >
          📁 Import CSV
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onSeedDemo}
          disabled={seedingDemo}
        >
          {seedingDemo ? 'Loading...' : '🎭 Load Demo Data'}
        </button>
      </div>

      <div className="empty-hint">
        <p>
          Demo data includes 12 months of UK-style transactions with realistic merchants
          like Tesco, Sainsbury's, Uber, and Netflix.
        </p>
      </div>
    </div>
  );
}
