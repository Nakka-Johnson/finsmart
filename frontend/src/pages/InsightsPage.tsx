/**
 * Insights v2 Dashboard - Sprint-1
 * 
 * Displays merchant insights and anomaly detection results
 * from the backend AI service.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InsightsPage.css';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuthStore } from '../store/auth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from '@/ui';
import { EmptyState } from '@/ui/EmptyState';
import { Page, PageHeader, PageContent } from '@/components/layout/Page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Upload, Lightbulb } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface MerchantInsight {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  avgAmount: number;
  category: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  monthlyData?: Array<{
    month: string;
    amount: number;
  }>;
}

interface Anomaly {
  id: number;
  transactionId: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  reason: string;
  status: 'new' | 'snoozed' | 'confirmed' | 'ignored';
  severity: 'high' | 'medium' | 'low';
}

type TabType = 'merchants' | 'anomalies';

// ============================================================================
// Main Component
// ============================================================================

export function InsightsPage() {
  const [, setActiveTab] = useState<TabType>('merchants');
  const [merchants, setMerchants] = useState<MerchantInsight[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  // Load data on mount
  useEffect(() => {
    if (token) loadInsights();
  }, [token]);

  async function loadInsights() {
    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Load both merchants and anomalies in parallel
      const [merchantsRes, anomaliesRes] = await Promise.all([
        fetch(`${apiBase}/api/insights/merchants`, { headers }),
        fetch(`${apiBase}/api/insights/anomalies`, { headers }),
      ]);

      if (!merchantsRes.ok || !anomaliesRes.ok) {
        throw new Error('Failed to load insights');
      }

      const merchantsData = await merchantsRes.json();
      const anomaliesData = await anomaliesRes.json();

      setMerchants(merchantsData);
      setAnomalies(anomaliesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  const navigate = useNavigate();

  return (
    <FeatureGate feature="insightsV2">
      <Page>
        <PageHeader
          title="Insights Dashboard"
          description="AI-powered spending analysis"
        >
          <Button variant="secondary" onClick={loadInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </PageHeader>

        <PageContent>
          <Tabs defaultValue="merchants" onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="merchants">Merchant Insights</TabsTrigger>
              <TabsTrigger value="anomalies" className="relative">
                Anomalies
                {anomalies.filter((a) => a.status === 'new').length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                    {anomalies.filter((a) => a.status === 'new').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            {loading && <InsightsLoadingSkeleton />}

            {error && (
              <Card className="insights__error">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-destructive">⚠️ {error}</p>
                    <Button variant="destructive" size="sm" onClick={loadInsights}>
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <>
                <TabsContent value="merchants">
                  {merchants.length === 0 ? (
                    /* Improved Empty State */
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-muted p-3">
                          <Lightbulb className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          No insights yet
                        </h3>
                        <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
                          Import some transactions to see AI-powered spending insights and merchant analysis.
                        </p>
                        <Button onClick={() => navigate('/import')}>
                          <Upload className="mr-2 h-4 w-4" />
                          Import CSV
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <MerchantsTab merchants={merchants} />
                  )}
                </TabsContent>

                <TabsContent value="anomalies">
                  <AnomaliesTab
                    anomalies={anomalies}
                    onAction={(id, action) => handleAnomalyAction(id, action)}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </PageContent>
      </Page>
    </FeatureGate>
  );

  async function handleAnomalyAction(id: number, action: 'snooze' | 'confirm' | 'ignore') {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const res = await fetch(`${apiBase}/api/insights/anomalies/${id}/${action}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} anomaly`);
      }

      // Reload anomalies
      await loadInsights();
    } catch (err) {
      console.error(`Error ${action}ing anomaly:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function InsightsLoadingSkeleton() {
  return (
    <div className="insights__skeleton">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Merchants Tab
// ============================================================================

interface MerchantsTabProps {
  merchants: MerchantInsight[];
}

function MerchantsTab({ merchants }: MerchantsTabProps) {
  const navigate = useNavigate();
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantInsight | null>(null);

  // Sort by total spent (descending)
  const sortedMerchants = [...merchants].sort((a, b) => b.totalSpent - a.totalSpent);

  // Top 10 for chart
  const top10 = sortedMerchants.slice(0, 10);

  // Empty state
  if (merchants.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No merchant data yet"
        description="Import transactions to see your spending breakdown by merchant."
        actions={[
          { label: 'Import CSV', onClick: () => navigate('/import') },
        ]}
      />
    );
  }

  // GBP formatter
  const formatGBP = (value: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

  return (
    <div className="merchants-tab">
      {/* Top Merchants Chart */}
      <Card className="insights__chart-card">
        <CardHeader>
          <CardTitle>Top Merchants by Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="merchant" angle={-45} textAnchor="end" height={100} stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis tickFormatter={(v) => formatGBP(v)} stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip formatter={(value) => formatGBP(Number(value))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="totalSpent" fill="var(--color-primary)" name="Total Spent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Merchants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Merchants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-wrapper">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th className="text-right">Total Spent</th>
                  <th className="text-right">Transactions</th>
                  <th className="text-right">Avg Amount</th>
                  <th>Trend</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedMerchants.map((merchant, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{merchant.merchant}</td>
                    <td>
                      <Badge variant="secondary">{merchant.category}</Badge>
                    </td>
                    <td className="text-right tabular-nums font-medium">{formatGBP(merchant.totalSpent)}</td>
                    <td className="text-right tabular-nums">{merchant.transactionCount}</td>
                    <td className="text-right tabular-nums">{formatGBP(merchant.avgAmount)}</td>
                    <td>
                      <span className={`trend trend--${merchant.trend}`}>
                        {merchant.trend === 'increasing' && '↑'}
                        {merchant.trend === 'stable' && '→'}
                        {merchant.trend === 'decreasing' && '↓'}
                        {' '}
                        {merchant.trend}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Detail Modal */}
      {selectedMerchant && (
        <MerchantDetailModal
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Anomalies Tab
// ============================================================================

interface AnomaliesTabProps {
  anomalies: Anomaly[];
  onAction: (id: number, action: 'snooze' | 'confirm' | 'ignore') => void;
}

function AnomaliesTab({ anomalies, onAction }: AnomaliesTabProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'snoozed'>('new');

  const filteredAnomalies = anomalies.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'new') return a.status === 'new';
    if (filter === 'snoozed') return a.status === 'snoozed';
    return true;
  });

  const newCount = anomalies.filter((a) => a.status === 'new').length;
  const snoozedCount = anomalies.filter((a) => a.status === 'snoozed').length;

  return (
    <div className="anomalies-tab">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-1">{newCount}</div>
            <p className="text-sm text-muted uppercase tracking-wide">New Anomalies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-warning mb-1">{snoozedCount}</div>
            <p className="text-sm text-muted uppercase tracking-wide">Snoozed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold mb-1">{anomalies.length}</div>
            <p className="text-sm text-muted uppercase tracking-wide">Total Detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="filter-bar">
        <Button
          variant={filter === 'new' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('new')}
        >
          New ({newCount})
        </Button>
        <Button
          variant={filter === 'snoozed' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('snoozed')}
        >
          Snoozed ({snoozedCount})
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({anomalies.length})
        </Button>
      </div>

      {/* Anomalies List */}
      <div className="anomalies-list">
        {filteredAnomalies.length === 0 && (
          <EmptyState
            icon="✨"
            title={`No ${filter !== 'all' ? filter : ''} anomalies`}
            description="No anomalies match the current filter."
            variant="compact"
          />
        )}

        {filteredAnomalies.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Anomaly Card
// ============================================================================

interface AnomalyCardProps {
  anomaly: Anomaly;
  onAction: (id: number, action: 'snooze' | 'confirm' | 'ignore') => void;
}

function AnomalyCard({ anomaly, onAction }: AnomalyCardProps) {
  const formatGBP = (value: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

  return (
    <Card className={`anomaly-card anomaly-card--${anomaly.severity} anomaly-card--${anomaly.status}`}>
      <CardContent className="p-4">
        <div className="anomaly-card__header">
          <div className="anomaly-card__title">
            <h3>{anomaly.merchant}</h3>
            <Badge
              variant={anomaly.severity === 'high' ? 'destructive' : anomaly.severity === 'medium' ? 'warning' : 'secondary'}
            >
              {anomaly.severity}
            </Badge>
          </div>
          <div className="anomaly-card__amount">{formatGBP(anomaly.amount)}</div>
        </div>

        <div className="anomaly-card__details">
          <div className="anomaly-card__row">
            <span className="anomaly-card__label">Category:</span>
            <span>{anomaly.category}</span>
          </div>
          <div className="anomaly-card__row">
            <span className="anomaly-card__label">Date:</span>
            <span>{new Date(anomaly.date).toLocaleDateString()}</span>
          </div>
          <div className="anomaly-card__row">
            <span className="anomaly-card__label">Reason:</span>
            <span className="text-destructive font-medium">{anomaly.reason}</span>
          </div>
        </div>

        {anomaly.status === 'new' && (
          <div className="anomaly-card__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAction(anomaly.id, 'snooze')}
              title="Snooze for later review"
            >
              😴 Snooze
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAction(anomaly.id, 'confirm')}
              title="This is unusual and correct"
            >
              ✓ Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(anomaly.id, 'ignore')}
              title="Ignore this pattern in future"
            >
              🚫 Ignore
            </Button>
          </div>
        )}

        {anomaly.status !== 'new' && (
          <div className={`anomaly-card__status anomaly-card__status--${anomaly.status}`}>
            {anomaly.status === 'snoozed' && '😴 Snoozed'}
            {anomaly.status === 'confirmed' && '✓ Confirmed'}
            {anomaly.status === 'ignored' && '🚫 Ignored'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Merchant Detail Modal
// ============================================================================

interface MerchantDetailModalProps {
  merchant: MerchantInsight;
  onClose: () => void;
}

function MerchantDetailModal({ merchant, onClose }: MerchantDetailModalProps) {
  const formatGBP = (value: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title">{merchant.merchant}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="merchant-stat">
              <span className="merchant-stat__label">Total Spent</span>
              <span className="merchant-stat__value">{formatGBP(merchant.totalSpent)}</span>
            </div>
            <div className="merchant-stat">
              <span className="merchant-stat__label">Transactions</span>
              <span className="merchant-stat__value">{merchant.transactionCount}</span>
            </div>
            <div className="merchant-stat">
              <span className="merchant-stat__label">Average Amount</span>
              <span className="merchant-stat__value">{formatGBP(merchant.avgAmount)}</span>
            </div>
            <div className="merchant-stat">
              <span className="merchant-stat__label">Category</span>
              <span className="merchant-stat__value">{merchant.category}</span>
            </div>
          </div>

          {merchant.monthlyData && merchant.monthlyData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">6-Month Trend</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={merchant.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                    <Tooltip 
                      formatter={(value) => formatGBP(Number(value))} 
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'var(--color-primary)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
