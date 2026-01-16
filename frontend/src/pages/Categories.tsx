import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { categoryApi } from '@/api/endpoints';
import type { CategoryResponse } from '@/api/types';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/http';
import { formatDate } from '@/utils/format';
import { MoreHorizontal, Plus, Trash2, Tags } from 'lucide-react';
import './Categories.css';

export function Categories() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  });

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await categoryApi.list(token);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddClick = () => {
    setFormData({ name: '', type: 'EXPENSE' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await categoryApi.create(formData, token);
      showToast('Category created', 'success');
      setShowModal(false);
      loadCategories();
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        showToast('Category already exists', 'error');
      } else {
        showToast('Failed to create category', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    if (!token) return;

    try {
      await categoryApi.delete(id, token);
      showToast('Category deleted', 'success');
      loadCategories();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const getCategoryColor = (type: string) => {
    return type === 'INCOME' ? '#10b981' : '#ef4444';
  };

  // Safe formatDate with null handling
  const safeFormatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    try {
      return formatDate(dateStr);
    } catch {
      return '—';
    }
  };

  return (
    <Page>
      <PageHeader
        title="Categories"
        description="Organize your transactions"
      >
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="medium" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tags className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No categories yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
                  Create categories to organize and group your transactions.
                </p>
                <Button onClick={handleAddClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Name</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[160px]">Created</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(c.type) }}
                          />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.type === 'INCOME' ? 'default' : 'destructive'}>
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {safeFormatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContent>

      {/* Add Category Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Groceries, Salary"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as 'INCOME' | 'EXPENSE' })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
