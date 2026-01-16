import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PageHeader,
  Badge,
  Skeleton,
} from '@/components/ui';
import { CashRunwayWidget, NarrativeCard, AnomalyInbox } from '../components/widgets';
import { useAuthStore } from '../store/auth';
import { transactionApi } from '../api/endpoints';
import type { InsightResponse } from '../api/types';
import { cn } from '@/lib/utils';

interface QuickStats {
  totalDebit: number;
  totalCredit: number;
  transactionCount: number;
  loading: boolean;
}

interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

export function DashboardV2() {
  const [stats, setStats] = useState<QuickStats>({
    totalDebit: 0,
    totalCredit: 0,
    transactionCount: 0,
    loading: true,
  });
  const [spendByCategory, setSpendByCategory] = useState<CategorySpend[]>([]);
  const [chartData, setChartData] = useState<{ month: string; spending: number; income: number }[]>(
    []
  );
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const { token } = useAuthStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const totalDebit = response.content
        .filter((t) => t.direction === 'OUT')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCredit = response.content
        .filter((t) => t.direction === 'IN')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate spending by category
      const categoryTotals: Record<string, number> = {};
      response.content
        .filter((t) => t.direction === 'OUT')
        .forEach((t) => {
          const cat = t.categoryId ? `Category-${t.categoryId}` : 'Other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

      const categories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalDebit) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      setSpendByCategory(categories);
      setStats({
        totalDebit,
        totalCredit,
        transactionCount: response.content.length,
        loading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, [token]);

  const loadChartData = useCallback(async () => {
    if (!token) return;
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const monthlyData: Record<string, { spending: number; income: number }> = {};
      response.content.forEach((t) => {
        const month = t.transactionDate.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { spending: 0, income: 0 };
        if (t.direction === 'OUT') monthlyData[month].spending += t.amount;
        else monthlyData[month].income += t.amount;
      });

      const data = Object.entries(monthlyData)
        .map(([month, values]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
          spending: values.spending,
          income: values.income,
        }))
        .slice(-6);

      setChartData(data);
    } catch {
      // Use demo data
      setChartData([
        { month: 'Aug', spending: 2450, income: 3200 },
        { month: 'Sep', spending: 2100, income: 3200 },
        { month: 'Oct', spending: 2800, income: 3500 },
        { month: 'Nov', spending: 2300, income: 3200 },
        { month: 'Dec', spending: 3100, income: 3800 },
        { month: 'Jan', spending: 2200, income: 3200 },
      ]);
    }
  }, [token]);

  // Insight loading is handled by NarrativeCard widget
  // We keep the insight state for potential manual summarization

  useEffect(() => {
    // Skip insight loading - handled by widgets
    setInsight(null);
  }, []);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, [loadStats, loadChartData]);

  const netFlow = stats.totalCredit - stats.totalDebit;
  const savingsRate = stats.totalCredit > 0 ? (netFlow / stats.totalCredit) * 100 : 0;

  // Category bar colors using Tailwind-compatible classes
  const categoryColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-slate-500',
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Your financial overview at a glance"
      >
        <Badge variant="secondary">Last 30 days</Badge>
      </PageHeader>

      {/* Hero Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <CashRunwayWidget />
        <NarrativeCard />
        <div className="md:col-span-2 xl:col-span-1">
          <AnomalyInbox />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Spending */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Spending
                </span>
                {stats.loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <span className="text-2xl font-bold text-destructive tabular-nums">
                    {formatCurrency(stats.totalDebit)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {stats.transactionCount} transactions
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Income
                </span>
                {stats.loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(stats.totalCredit)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">This month</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Flow */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Net Flow
                </span>
                {stats.loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <span
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      netFlow >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive'
                    )}
                  >
                    {netFlow >= 0 ? '+' : ''}
                    {formatCurrency(netFlow)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {savingsRate > 0 ? `${savingsRate.toFixed(0)}% savings rate` : 'Deficit'}
                </span>
              </div>
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  netFlow >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'
                )}
              >
                {netFlow >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Spending Trend - wider */}
        <Card className="lg:col-span-3 min-h-[360px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Cash Flow Trend
            </CardTitle>
            <CardDescription>Income vs spending over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="-mx-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
                    formatter={(value) => [formatCurrency(value as number)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    name="Spending"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    fill="url(#spendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="lg:col-span-2 min-h-[360px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              Spending by Category
            </CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {spendByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>No spending data available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {spendByCategory.map((cat, index) => (
                  <div key={cat.category} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          categoryColors[index % categoryColors.length]
                        )}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      {insight && (
        <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{insight.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
