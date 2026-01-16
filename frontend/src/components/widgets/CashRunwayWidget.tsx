import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';
import { getCashRunway, type CashRunwayData } from '../../api/ai';
import { useAuthStore } from '../../store/auth';
import { cn } from '@/lib/utils';

export function CashRunwayWidget() {
  const [data, setData] = useState<CashRunwayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCashRunway(token || undefined);
      setData(result);
    } catch {
      setError('Unable to load cash runway');
      // Use mock data for demo
      setData({
        currentBalance: 24580,
        daysUntilLow: 45,
        lowThreshold: 5000,
        runway: [
          { date: '2024-01-15', predictedBalance: 24580, lowerBound: 23000, upperBound: 26000 },
          { date: '2024-01-22', predictedBalance: 22100, lowerBound: 20500, upperBound: 23700 },
          { date: '2024-01-29', predictedBalance: 19800, lowerBound: 17800, upperBound: 21800 },
          { date: '2024-02-05', predictedBalance: 17200, lowerBound: 15000, upperBound: 19400 },
          { date: '2024-02-12', predictedBalance: 15100, lowerBound: 12800, upperBound: 17400 },
          { date: '2024-02-19', predictedBalance: 12800, lowerBound: 10200, upperBound: 15400 },
          { date: '2024-02-26', predictedBalance: 10500, lowerBound: 7800, upperBound: 13200 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRunwayStatus = () => {
    if (!data) return { status: 'unknown', colorClass: 'text-muted-foreground' };
    if (data.daysUntilLow > 60) return { status: 'healthy', colorClass: 'text-emerald-600 dark:text-emerald-400' };
    if (data.daysUntilLow > 30) return { status: 'moderate', colorClass: 'text-amber-600 dark:text-amber-400' };
    return { status: 'low', colorClass: 'text-destructive' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Cash Runway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { colorClass } = getRunwayStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          Cash Runway
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Balance
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(data?.currentBalance || 0)}
            </span>
          </div>
          <div className="text-right">
            <span className={cn('text-3xl font-bold tabular-nums', colorClass)}>
              {data?.daysUntilLow || 0}
            </span>
            <span className="block text-xs text-muted-foreground">
              days until {formatCurrency(data?.lowThreshold || 0)}
            </span>
          </div>
        </div>

        <div className="-mx-4">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data?.runway || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="boundsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                formatter={(value) => [formatCurrency(value as number), 'Predicted']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#boundsGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="predictedBalance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#cashGradient)"
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {error && (
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Demo Data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
