import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { budgetApi, categoryApi } from '@/api/endpoints';
import type { BudgetResponse, BudgetSummary, CategoryResponse } from '@/api/types';
import { Card, CardContent, Button, Badge } from '@/ui';
import { Page, PageHeader, PageContent } from '@/components/layout/Page';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import './Budgets.css';

export function Budgets() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [summary, setSummary] = useState<BudgetSummary[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetResponse | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
  });

  const loadBudgets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await budgetApi.list(month, year, token);
      setBudgets(data);
    } catch {
      showToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, month, year, showToast]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await budgetApi.summary(month, year, token);
      setSummary(data);
    } catch {
      showToast('Failed to load summary', 'error');
    }
  }, [token, month, year, showToast]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await categoryApi.list(token);
      setCategories(data.filter(c => c.type === 'EXPENSE'));
    } catch {
      showToast('Failed to load categories', 'error');
    }
  }, [token, showToast]);

  useEffect(() => {
    loadBudgets();
    loadSummary();
    loadCategories();
  }, [loadBudgets, loadSummary, loadCategories]);

  const handleAddClick = () => {
    setEditingBudget(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      amount: 0,
    });
    setShowModal(true);
  };

  const handleEditClick = (budget: BudgetResponse) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.id, { ...formData, month, year }, token);
        showToast('Budget updated', 'success');
      } else {
        await budgetApi.create({ ...formData, month, year }, token);
        showToast('Budget created', 'success');
      }
      setShowModal(false);
      loadBudgets();
      loadSummary();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    if (!token) return;

    try {
      await budgetApi.delete(id, token);
      showToast('Budget deleted', 'success');
      loadBudgets();
      loadSummary();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return '#ef4444'; // red
    if (percentage >= 80) return '#f59e0b'; // yellow
    return '#3b82f6'; // blue
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  return (
    <Page>
      <PageHeader
        title="Budgets"
        description="Track your spending limits"
      >
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="pt-6">
            {/* Period Selector */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>

              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                min="2000"
                max="2100"
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="medium" />
              </div>
            ) : (
              <>
                {summary.length > 0 && (
                  <section className="budgets-page__summary">
                    <h3 className="budgets-page__section-title">Summary</h3>
                    <div className="budgets-page__grid">
                      {summary.map(s => {
                        const percentage = getProgressPercentage(s.spentAmount, s.budgetAmount);
                        const color = getProgressColor(s.spentAmount, s.budgetAmount);
                        return (
                          <Card key={s.categoryId} className="budgets-page__card">
                            <CardContent className="p-4">
                              <div className="budgets-page__card-header">
                                <strong>{s.categoryName}</strong>
                                {s.spentAmount > s.budgetAmount && (
                                  <Badge variant="destructive">Over</Badge>
                                )}
                              </div>
                              <div className="budgets-page__amounts">
                                {formatCurrency(s.spentAmount)} / {formatCurrency(s.budgetAmount)}
                              </div>
                              <div className="budgets-page__progress">
                                <div
                                  className="budgets-page__progress-bar"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                              {s.spentAmount > s.budgetAmount && (
                                <div className="budgets-page__over-budget">
                                  Over by {formatCurrency(s.spentAmount - s.budgetAmount)}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="budgets-page__section-title">Manage Budgets</h3>
                  {budgets.length === 0 ? (
                    /* Improved Empty State */
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 rounded-full bg-muted p-3">
                        <PiggyBank className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        No budgets for this period
                      </h3>
                      <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
                        Create a budget to track your spending limits and stay on top of your finances.
                      </p>
                      <Button onClick={handleAddClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Budget
                      </Button>
                    </div>
                  ) : (
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgets.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {b.categoryName || categories.find(c => c.id === b.categoryId)?.name || '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(b.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEditClick(b)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <div className="text-sm text-muted-foreground">
                {new Date(year, month - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </PageContent>
    </Page>
  );
}
