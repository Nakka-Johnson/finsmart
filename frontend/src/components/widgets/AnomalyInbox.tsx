import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge, Button } from '@/components/ui';
import { getRecentAnomalies, type AnomalyScore } from '../../api/ai';
import { useAuthStore } from '../../store/auth';

interface AnomalyWithDetails extends AnomalyScore {
  description?: string;
  amount?: number;
  date?: string;
}

export function AnomalyInbox() {
  const [anomalies, setAnomalies] = useState<AnomalyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRecentAnomalies(5, token || undefined);
      setAnomalies(result);
    } catch {
      setError('Unable to load anomalies');
      // Use mock data for demo
      setAnomalies([
        {
          transactionId: 1,
          score: 0.92,
          isAnomaly: true,
          reason: 'Unusual amount',
          description: 'AMAZON MARKETPLACE',
          amount: -589.99,
          date: '2024-01-15',
        },
        {
          transactionId: 2,
          score: 0.85,
          isAnomaly: true,
          reason: 'New merchant',
          description: 'CRYPTO EXCHANGE LTD',
          amount: -1250.00,
          date: '2024-01-14',
        },
        {
          transactionId: 3,
          score: 0.78,
          isAnomaly: true,
          reason: 'Unusual time',
          description: 'LATE NIGHT FOOD CO',
          amount: -45.60,
          date: '2024-01-14',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(value));
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 0.9) return 'destructive';
    if (score >= 0.7) return 'secondary';
    return 'outline';
  };

  const handleViewAll = () => {
    navigate('/transactions?filter=anomalies');
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Anomaly Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-3 w-[40%]" />
                </div>
                <Skeleton className="h-6 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Anomaly Inbox
        </CardTitle>
        {anomalies.length > 0 && (
          <Badge variant="destructive">{anomalies.length}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {anomalies.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-medium text-foreground">No anomalies detected</p>
            <span className="text-sm text-muted-foreground mt-1">
              Your recent transactions look normal
            </span>
          </div>
        ) : (
          <>
            <ul className="space-y-3 flex-1">
              {anomalies.map((anomaly) => (
                <li
                  key={anomaly.transactionId}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">
                      {anomaly.description || `Transaction #${anomaly.transactionId}`}
                    </span>
                    <span className="text-xs text-muted-foreground">{anomaly.reason}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {anomaly.amount && (
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(anomaly.amount)}
                      </span>
                    )}
                    <Badge variant={getScoreVariant(anomaly.score)} className="text-xs">
                      {Math.round(anomaly.score * 100)}%
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t mt-auto">
              <Button variant="ghost" size="sm" className="w-full" onClick={handleViewAll}>
                View all anomalies
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {error && (
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Demo Data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
