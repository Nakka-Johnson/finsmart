/**
 * Dashboard - Premium UI with truthful data
 * 
 * Shows real data from the insights summary API.
 * Displays proper empty states when no data exists.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Badge,
  Skeleton,
  SkeletonChart,
} from '@/ui';
import { EmptyState } from '@/ui/EmptyState';
import { Page, PageHeader, PageContent } from '@/components/layout/Page';
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

  // Date range options
  const rangeOptions = [
    { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  ];

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description="Your financial overview"
      >
        <Badge
          variant={health.backend === 'UP' ? 'default' : health.backend === 'DOWN' ? 'destructive' : 'secondary'}
        >
          Backend: {health.backend}
        </Badge>
        <Badge
          variant={health.ai === 'UP' ? 'default' : health.ai === 'DOWN' ? 'destructive' : 'secondary'}
        >
          AI: {health.ai}
        </Badge>
      </PageHeader>

      <PageContent>
        {/* Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={range}
            onChange={e => setRange(e.target.value as DateRange)}
            options={rangeOptions}
            size="sm"
            aria-label="Select date range"
          />
          <Button variant="secondary" size="sm" onClick={loadSummary} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : !hasData ? (
          <DashboardEmptyState onSeedDemo={handleSeedDemo} seedingDemo={seedingDemo} />
        ) : (
          <DashboardContent summary={summary!} />
        )}
      </PageContent>
    </Page>
  );
}

/**
 * Dashboard loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="dashboard__skeleton">
      {/* Hero cards skeleton */}
      <div className="dashboard__hero-grid">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent>
              <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={32} style={{ marginBottom: 16 }} />
              <SkeletonChart height={120} />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="dashboard__charts-grid">
        <Card>
          <CardHeader>
            <Skeleton width={160} height={20} />
          </CardHeader>
          <CardContent>
            <SkeletonChart height={280} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton width={160} height={20} />
          </CardHeader>
          <CardContent>
            <SkeletonChart height={280} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Dashboard empty state with CTAs
 */
function DashboardEmptyState({
  onSeedDemo,
  seedingDemo,
}: {
  onSeedDemo: () => void;
  seedingDemo: boolean;
}) {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon="📊"
      title="No transactions yet"
      description="Import your transactions or load demo data to see your financial insights and track your spending."
      actions={[
        {
          label: '📁 Import CSV',
          onClick: () => navigate('/import'),
          variant: 'primary',
        },
        {
          label: seedingDemo ? 'Loading...' : '🎭 Load Demo Data',
          onClick: onSeedDemo,
          variant: 'secondary',
        },
      ]}
    />
  );
}

/**
 * Dashboard content when data exists
 */
function DashboardContent({
  summary,
}: {
  summary: InsightsSummaryResponse;
}) {
  return (
    <>
      {/* Hero Stats Row */}
      <div className="dashboard__hero-grid">
        {/* Cash Runway Card */}
        <Card className="dashboard__hero-card">
          <CardHeader>
            <CardTitle>Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hero-stat">
              <span className="hero-stat__value">{currencyGBP(summary.currentBalance)}</span>
              <span className="hero-stat__label">Current Balance</span>
            </div>
            <div className="hero-stat__row">
              <div className="hero-stat__item">
                <span className="hero-stat__item-value text-success">{currencyGBP(summary.totalIncome)}</span>
                <span className="hero-stat__item-label">Income</span>
              </div>
              <div className="hero-stat__item">
                <span className="hero-stat__item-value text-danger">{currencyGBP(summary.totalSpending)}</span>
                <span className="hero-stat__item-label">Spending</span>
              </div>
              <div className="hero-stat__item">
                <span className={`hero-stat__item-value ${summary.netFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                  {currencyGBP(summary.netFlow)}
                </span>
                <span className="hero-stat__item-label">Net Flow</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Changed Card */}
        <Card className="dashboard__hero-card">
          <CardHeader>
            <CardTitle>What Changed</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.changeNarrative.length > 0 ? (
              <ul className="change-list">
                {summary.changeNarrative.slice(0, 4).map((item, idx) => (
                  <li key={idx} className="change-list__item">
                    <span className="change-list__label">{item.label}</span>
                    <span className="change-list__note">{item.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">No significant changes this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Anomaly Inbox Card */}
        <Card className="dashboard__hero-card">
          <CardHeader>
            <CardTitle>
              Flagged Transactions
              {summary.anomaliesPreview.length > 0 && (
                <Badge variant="danger" size="sm" style={{ marginLeft: 8 }}>
                  {summary.anomaliesPreview.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.anomaliesPreview.length > 0 ? (
              <ul className="anomaly-list">
                {summary.anomaliesPreview.slice(0, 3).map((a, idx) => (
                  <li key={idx} className="anomaly-list__item">
                    <span className="anomaly-list__merchant">{a.merchantName}</span>
                    <span className="anomaly-list__amount">{currencyGBP(a.amount)}</span>
                    <Badge
                      variant={a.score >= 0.9 ? 'danger' : a.score >= 0.8 ? 'warning' : 'default'}
                      size="sm"
                    >
                      {Math.round(a.score * 100)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">No anomalies detected. 🎉</p>
            )}
            <Link to="/insights" className="dashboard__view-all">
              View all →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="dashboard__charts-grid">
        {/* Spending by Category */}
        {summary.spendByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.spendByCategory}
                    layout="vertical"
                    margin={{ left: 80, right: 16, top: 8, bottom: 8 }}
                  >
                    <XAxis type="number" tickFormatter={v => currencyGBP(v)} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(value) => currencyGBP(value as number)} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {summary.spendByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Merchants */}
        {summary.topMerchants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="dashboard__merchants-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topMerchants.slice(0, 5).map((m, idx) => (
                    <tr key={idx}>
                      <td className="truncate">{m.merchantName}</td>
                      <td className="text-right tabular-nums font-medium">{currencyGBP(m.total)}</td>
                      <td className="text-right tabular-nums text-muted">{m.txCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link to="/insights" className="dashboard__view-all">
                View all merchants →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="dashboard__footer">
        <span className="text-sm text-muted">
          Based on {summary.transactionCount} transactions from{' '}
          {formatDate(summary.periodStart)} to {formatDate(summary.periodEnd)}
        </span>
      </footer>
    </>
  );
}
