import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { transactionApi, categoryApi, accountApi } from '@/api/endpoints';
import type {
  TransactionResponse,
  TransactionRequest,
  CategoryResponse,
  AccountResponse,
  ImportPreviewResponse,
  ImportSuccessResponse,
  BulkActionResponse,
} from '@/api/types';
import { Card, CardContent, Button } from '@/ui';
import { Page, PageHeader, PageContent } from '@/components/layout/Page';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/utils/format';
import { MerchantChip } from '@/components/MerchantChip';
import { CategoryPill } from '@/components/CategoryPill';
import { WhyDrawer } from '@/components/WhyDrawer';
import { Plus, Upload, InboxIcon } from 'lucide-react';
import './Transactions.css';

interface Filters {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  direction?: 'IN' | 'OUT' | 'ALL';
}

interface WhyDrawerState {
  open: boolean;
  transactionId: number;
  type: 'category' | 'anomaly';
  currentValue: string;
  confidence?: number;
}

export function Transactions() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [formData, setFormData] = useState<TransactionRequest>({
    accountId: '',
    categoryId: '',
    amount: 0,
    direction: 'OUT',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRecategoriseModal, setShowRecategoriseModal] = useState(false);
  const [recategoriseTargetId, setRecategoriseTargetId] = useState('');

  // CSV Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');
  const [importPreviewMode, setImportPreviewMode] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [applySuggestions, setApplySuggestions] = useState(true);

  // Why drawer state
  const [whyDrawer, setWhyDrawer] = useState<WhyDrawerState>({
    open: false,
    transactionId: 0,
    type: 'category',
    currentValue: '',
  });

  const openWhyDrawer = (transaction: TransactionResponse) => {
    const categoryName = categories.find(c => c.id === transaction.categoryId)?.name || 'Unknown';
    setWhyDrawer({
      open: true,
      transactionId: parseInt(transaction.id),
      type: 'category',
      currentValue: categoryName,
      confidence: transaction.categoryConfidence,
    });
  };

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: {
        token: string;
        page: number;
        size: number;
        accountId?: string;
        categoryId?: string;
        startDate?: string;
        endDate?: string;
      } = { token, page, size: 20 };
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await transactionApi.list(params);
      setTransactions(response.content);
      setTotalPages(response.totalPages);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, page, filters, showToast]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await categoryApi.list(token);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    }
  }, [token, showToast]);

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await accountApi.list(token);
      setAccounts(data);
    } catch {
      showToast('Failed to load accounts', 'error');
    }
  }, [token, showToast]);

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadAccounts();
  }, [loadTransactions, loadCategories, loadAccounts]);

  const handleAddClick = () => {
    setEditingTransaction(null);
    setFormData({
      accountId: accounts[0]?.id || '',
      categoryId: categories[0]?.id || '',
      amount: 0,
      direction: 'OUT',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleEditClick = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setFormData({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      direction: transaction.direction,
      description: transaction.description || '',
      transactionDate: transaction.transactionDate,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingTransaction) {
        await transactionApi.update(editingTransaction.id, formData, token);
        showToast('Transaction updated', 'success');
      } else {
        await transactionApi.create(formData, token);
        showToast('Transaction added', 'success');
      }
      setShowModal(false);
      loadTransactions();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    if (!token) return;

    try {
      await transactionApi.delete(id, token);
      showToast('Transaction deleted', 'success');
      loadTransactions();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPage(0);
  };

  // CSV Import handlers
  const handleImportClick = () => {
    setImportFile(null);
    setImportAccountId(accounts[0]?.id || '');
    setImportPreviewMode(true);
    setPreviewData(null);
    setApplySuggestions(true);
    setShowImportModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setPreviewData(null);
    }
  };

  const handleImportPreview = async () => {
    if (!token || !importFile) return;

    setImportLoading(true);
    try {
      const response = await transactionApi.importCsv({
        file: importFile,
        accountId: importAccountId || undefined,
        preview: true,
        token,
      });
      setPreviewData(response);
      showToast('Preview loaded successfully', 'success');
    } catch (error) {
      showToast((error as Error).message || 'Preview failed', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportExecute = async () => {
    if (!token || !importFile) return;

    setImportLoading(true);
    try {
      const response: ImportSuccessResponse = await transactionApi.importCsv({
        file: importFile,
        accountId: importAccountId || undefined,
        preview: false,
        token,
      });
      showToast(`Successfully imported ${response.insertedCount} transactions`, 'success');
      setShowImportModal(false);
      setImportFile(null);
      setPreviewData(null);
      loadTransactions();
    } catch (error) {
      showToast((error as Error).message || 'Import failed', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Bulk action handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!token || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;

    setLoading(true);
    try {
      const response = (await transactionApi.bulkAction(
        {
          action: 'DELETE',
          ids: Array.from(selectedIds),
        },
        token
      )) as BulkActionResponse;
      showToast(response.message, 'success');
      setSelectedIds(new Set());
      loadTransactions();
    } catch {
      showToast('Bulk delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRecategorise = async () => {
    if (!token || selectedIds.size === 0 || !recategoriseTargetId) return;

    setLoading(true);
    try {
      const response = (await transactionApi.bulkAction(
        {
          action: 'RECATEGORISE',
          ids: Array.from(selectedIds),
          categoryId: recategoriseTargetId,
        },
        token
      )) as BulkActionResponse;
      showToast(response.message, 'success');
      setSelectedIds(new Set());
      setShowRecategoriseModal(false);
      loadTransactions();
    } catch {
      showToast('Bulk recategorise failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <Page>
      <PageHeader
        title="Transactions"
        description="Manage and track your income and expenses"
      >
        <Button variant="secondary" onClick={handleImportClick}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </PageHeader>

      <PageContent>
        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
            <span className="text-sm font-medium">{selectedIds.size} transaction(s) selected</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRecategoriseTargetId(categories[0]?.id || '');
                  setShowRecategoriseModal(true);
                }}
              >
                Recategorise
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Responsive Filter Bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center lg:gap-3">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filters.accountId || ''}
            onChange={e => handleFilterChange('accountId', e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filters.categoryId || ''}
            onChange={e => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filters.direction || 'ALL'}
            onChange={e => handleFilterChange('direction', e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="IN">Income</option>
            <option value="OUT">Expense</option>
          </select>

          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Start Date"
            value={filters.startDate || ''}
            onChange={e => handleFilterChange('startDate', e.target.value)}
          />

          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="End Date"
            value={filters.endDate || ''}
            onChange={e => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="medium" />
              </div>
            ) : transactions.length === 0 ? (
              /* Improved Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <InboxIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  No transactions found
                </h3>
                <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
                  {accounts.length === 0 
                    ? 'Create an account first, then import your transactions.'
                    : 'Import a CSV file or add transactions manually to get started.'
                  }
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => navigate('/import')} disabled={accounts.length === 0}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button variant="ghost" onClick={handleAddClick} disabled={accounts.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manually
                  </Button>
                </div>
              </div>
            ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={transactions.length > 0 && selectedIds.size === transactions.length}
                      onChange={handleSelectAll}
                      aria-label="Select all transactions"
                    />
                  </th>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
                  return (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t.id)}
                          onChange={e => handleSelectOne(t.id, e.target.checked)}
                          aria-label={`Select transaction ${t.description}`}
                        />
                      </td>
                      <td>{formatDate(t.transactionDate)}</td>
                      <td>
                        <MerchantChip
                          original={t.description || 'Unknown'}
                          normalised={t.normalizedMerchant}
                          confidence={t.merchantConfidence}
                          showOriginal={!!t.normalizedMerchant && t.normalizedMerchant !== t.description}
                        />
                      </td>
                      <td className={t.direction === 'IN' ? 'amount-positive' : 'amount-negative'}>
                        {t.direction === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td>
                        <CategoryPill
                          category={categoryName}
                          confidence={t.categoryConfidence}
                          onClick={() => openWhyDrawer(t)}
                          showConfidence={t.categoryConfidence !== undefined}
                        />
                      </td>
                      <td>
                        <div className="transactions-page__row-actions">
                          <Button size="sm" variant="secondary" onClick={() => handleEditClick(t)} aria-label="Edit transaction">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(t.id)}
                            aria-label="Delete transaction"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
          </CardContent>
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.accountId}
                  onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                  required
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Direction</label>
                <select
                  value={formData.direction}
                  onChange={e =>
                    setFormData({ ...formData, direction: e.target.value as 'IN' | 'OUT' })
                  }
                  required
                >
                  <option value="IN">Income</option>
                  <option value="OUT">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: previewData ? '1200px' : '600px' }}
          >
            <div className="modal-header">
              <h2>Import CSV</h2>
              <button onClick={() => setShowImportModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <div className="modal-body">
              {!previewData ? (
                <>
                  <div className="form-group">
                    <label>CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                    <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                      CSV columns: date, amount, direction, description, merchant, category
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Default Account (optional)</label>
                    <select
                      value={importAccountId}
                      onChange={e => setImportAccountId(e.target.value)}
                    >
                      <option value="">Use accountId from CSV</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={importPreviewMode}
                        onChange={e => setImportPreviewMode(e.target.checked)}
                      />
                      Preview with AI Categorization
                    </label>
                  </div>

                  {importLoading && <Loader size="medium" />}
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: previewData.invalidRows > 0 ? '#fff3cd' : '#d1f0d1',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong>Preview Summary:</strong> {previewData.totalRows} rows total,{' '}
                    {previewData.validRows} valid, {previewData.invalidRows} invalid
                  </div>

                  {previewData.errors.length > 0 && (
                    <div
                      style={{
                        background: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        maxHeight: '150px',
                        overflow: 'auto',
                      }}
                    >
                      <strong>Errors:</strong>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        {previewData.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.rowNumber}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {previewData.rows.length > 0 && (
                    <>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={applySuggestions}
                            onChange={e => setApplySuggestions(e.target.checked)}
                          />
                          Apply AI category suggestions when importing
                        </label>
                      </div>

                      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Direction</th>
                              <th>Merchant</th>
                              <th>Description</th>
                              <th>Original Cat.</th>
                              <th>Suggested Cat.</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.rows.map(row => (
                              <tr key={row.rowNumber}>
                                <td>{row.rowNumber}</td>
                                <td>{formatDate(row.postedAt)}</td>
                                <td>{formatCurrency(row.amount)}</td>
                                <td>
                                  <span
                                    className={`badge badge-${row.direction === 'CREDIT' ? 'success' : 'error'}`}
                                  >
                                    {row.direction}
                                  </span>
                                </td>
                                <td>{row.merchant || '-'}</td>
                                <td>{row.description || '-'}</td>
                                <td>{row.originalCategory || '-'}</td>
                                <td>
                                  {row.suggestedCategory ? (
                                    <strong style={{ color: '#0066cc' }}>
                                      {row.suggestedCategory}
                                    </strong>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>
                                  <small style={{ color: '#666' }}>
                                    {row.categorizationReason || '-'}
                                  </small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {importLoading && <Loader size="medium" />}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewData(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              {!previewData ? (
                <button
                  onClick={handleImportPreview}
                  className="btn btn-primary"
                  disabled={!importFile || importLoading}
                >
                  {importPreviewMode ? 'Preview' : 'Import Now'}
                </button>
              ) : (
                <button
                  onClick={handleImportExecute}
                  className="btn btn-primary"
                  disabled={previewData.validRows === 0 || importLoading}
                >
                  Import {previewData.validRows} Transaction(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recategorise Modal */}
      {showRecategoriseModal && (
        <div className="modal-overlay" onClick={() => setShowRecategoriseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recategorise Transactions</h2>
              <button onClick={() => setShowRecategoriseModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Recategorise <strong>{selectedIds.size}</strong> selected transaction(s) to:
              </p>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={recategoriseTargetId}
                  onChange={e => setRecategoriseTargetId(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowRecategoriseModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleBulkRecategorise} className="btn btn-primary">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why Drawer for category explanation */}
      <WhyDrawer
        open={whyDrawer.open}
        onClose={() => setWhyDrawer(prev => ({ ...prev, open: false }))}
        transactionId={whyDrawer.transactionId}
        type={whyDrawer.type}
        currentValue={whyDrawer.currentValue}
        confidence={whyDrawer.confidence}
      />
      </PageContent>
    </Page>
  );
}
