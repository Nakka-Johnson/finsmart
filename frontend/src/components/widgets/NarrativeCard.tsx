import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@/components/ui';
import { getNarrativeInsight, type NarrativeInsight } from '../../api/ai';
import { useAuthStore } from '../../store/auth';

export function NarrativeCard() {
  const [data, setData] = useState<NarrativeInsight | null>(null);
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
      const result = await getNarrativeInsight(token || undefined);
      setData(result);
    } catch {
      setError('Unable to load insights');
      // Use mock data for demo
      setData({
        summary: "Your spending this month is 12% lower than last month. You're on track to save £340 by month end.",
        highlights: [
          'Groceries spending down 18% – great job!',
          'Dining out increased by £85 compared to usual',
          'Subscription costs remain stable at £127/month',
        ],
        topCategory: 'Housing',
        topCategorySpend: 1250,
        trend: 'down',
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendVariant = (trend: 'up' | 'down' | 'stable'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    // For spending, down is good, up is concerning
    switch (trend) {
      case 'down':
        return 'secondary'; // green-ish in our theme
      case 'up':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-[90%]" />
            <Skeleton className="h-5 w-[70%]" />
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[90%]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
        {data?.trend && (
          <Badge variant={getTrendVariant(data.trend)} className="flex items-center gap-1">
            {getTrendIcon(data.trend)}
            Spending {data.trend}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {data?.summary}
        </p>

        {data?.highlights && data.highlights.length > 0 && (
          <ul className="space-y-2 mb-4">
            {data.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-foreground">{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        {data?.topCategory && (
          <div className="pt-3 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top spending category
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium">{data.topCategory}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatCurrency(data.topCategorySpend)}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Demo Data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
