/**
 * CSV Import v2 - Sprint-1
 * 
 * Enhanced CSV import with:
 * - AI-powered category suggestions
 * - Duplicate detection
 * - Header mapping
 * - Preview before import
 */

import { useState, useRef } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import './CSVImportPage.css';

// ============================================================================
// Types
// ============================================================================

interface Account {
  id: string;
  name: string;
  type: string;
}

interface HeaderMapping {
  date?: number;
  description?: number;
  amount?: number;
  category?: number;
}

interface PreviewRow {
  rowIndex: number;
  date: string;
  description: string;
  amount: number;
  category?: string;
  suggestedCategory?: string;
  categoryScore?: number;
  isDuplicate: boolean;
  selected: boolean;
}

interface ImportStats {
  total: number;
  duplicates: number;
  selected: number;
  categorized: number;
}

type ImportStep = 'upload' | 'map-headers' | 'preview' | 'importing' | 'complete';

// ============================================================================
// Main Component
// ============================================================================

export function CSVImportPage() {
  const showToast = useToastStore((state) => state.showToast);

  // State
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<HeaderMapping>({});
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    duplicates: 0,
    selected: 0,
    categorized: 0,
  });
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load accounts on mount
  useState(() => {
    loadAccounts();
  });

  async function loadAccounts() {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const token = useAuthStore.getState().token;

      const res = await fetch(`${apiBase}/api/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to load accounts');

      const data = await res.json();
      setAccounts(data);

      // Auto-select first account
      if (data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      showToast('Failed to load accounts', 'error');
    }
  }

  // ============================================================================
  // Step 1: Upload
  // ============================================================================

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file || !selectedAccount) {
      showToast('Please select a file and account', 'error');
      return;
    }

    try {
      // Read CSV file
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        showToast('CSV file must have headers and at least one row', 'error');
        return;
      }

      // Parse CSV (simple parsing - handles basic CSV)
      const parsed = lines.map((line) => {
        // Handle quoted fields
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        fields.push(current.trim());

        return fields;
      });

      const csvHeaders = parsed[0];
      const dataRows = parsed.slice(1);

      setCsvData(dataRows);
      setHeaders(csvHeaders);

      // Auto-detect header mapping
      const mapping = autoDetectHeaders(csvHeaders);
      setHeaderMapping(mapping);

      setStep('map-headers');
    } catch (err) {
      console.error('Error reading CSV:', err);
      showToast('Failed to read CSV file', 'error');
    }
  }

  function autoDetectHeaders(csvHeaders: string[]): HeaderMapping {
    const mapping: HeaderMapping = {};

    csvHeaders.forEach((header, index) => {
      const lower = header.toLowerCase();

      if (lower.includes('date') || lower.includes('posted')) {
        mapping.date = index;
      } else if (
        lower.includes('description') ||
        lower.includes('merchant') ||
        lower.includes('payee')
      ) {
        mapping.description = index;
      } else if (lower.includes('amount') || lower.includes('debit') || lower.includes('credit')) {
        mapping.amount = index;
      } else if (lower.includes('category') || lower.includes('type')) {
        mapping.category = index;
      }
    });

    return mapping;
  }

  // ============================================================================
  // Step 2: Map Headers
  // ============================================================================

  function handleHeaderMappingChange(field: keyof HeaderMapping, value: string) {
    setHeaderMapping((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : parseInt(value),
    }));
  }

  async function handleMapHeaders() {
    // Validate required fields
    if (
      headerMapping.date === undefined ||
      headerMapping.description === undefined ||
      headerMapping.amount === undefined
    ) {
      showToast('Please map Date, Description, and Amount fields', 'error');
      return;
    }

    // Generate preview
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const token = useAuthStore.getState().token;

      // Build preview request
      const rows = csvData.map((row) => ({
        date: row[headerMapping.date!],
        description: row[headerMapping.description!],
        amount: parseFloat(row[headerMapping.amount!]),
        category: headerMapping.category !== undefined ? row[headerMapping.category] : undefined,
      }));

      // Call preview endpoint
      const res = await fetch(`${apiBase}/api/transactions/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          rows,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate preview');

      const preview = await res.json();

      // Build preview rows with AI suggestions
      const previewData: PreviewRow[] = preview.rows.map((row: {
        date: string;
        description: string;
        amount: number;
        category?: string;
        aiSuggestedCategory?: string;
        aiScore?: number;
        isDuplicate: boolean;
      }, index: number) => ({
        rowIndex: index,
        date: row.date,
        description: row.description,
        amount: row.amount,
        category: row.category,
        suggestedCategory: row.aiSuggestedCategory,
        categoryScore: row.aiScore,
        isDuplicate: row.isDuplicate,
        selected: !row.isDuplicate, // Auto-select non-duplicates
      }));

      setPreviewRows(previewData);

      // Calculate stats
      const total = previewData.length;
      const duplicates = previewData.filter((r) => r.isDuplicate).length;
      const selected = previewData.filter((r) => r.selected).length;
      const categorized = previewData.filter(
        (r) => r.suggestedCategory || r.category
      ).length;

      setStats({ total, duplicates, selected, categorized });
      setStep('preview');
    } catch (err) {
      console.error('Error generating preview:', err);
      showToast('Failed to generate preview', 'error');
    }
  }

  // ============================================================================
  // Step 3: Preview
  // ============================================================================

  function toggleRowSelection(rowIndex: number) {
    setPreviewRows((prev) =>
      prev.map((row) =>
        row.rowIndex === rowIndex ? { ...row, selected: !row.selected } : row
      )
    );

    // Update stats
    setStats((prev) => ({
      ...prev,
      selected: previewRows.filter((r) =>
        r.rowIndex === rowIndex ? !r.selected : r.selected
      ).length,
    }));
  }

  function toggleSelectAll() {
    const hasUnselected = previewRows.some((r) => !r.selected && !r.isDuplicate);

    setPreviewRows((prev) =>
      prev.map((row) =>
        row.isDuplicate ? row : { ...row, selected: hasUnselected }
      )
    );

    setStats((prev) => ({
      ...prev,
      selected: hasUnselected
        ? previewRows.filter((r) => !r.isDuplicate).length
        : 0,
    }));
  }

  function applySuggestedCategory(rowIndex: number) {
    setPreviewRows((prev) =>
      prev.map((row) =>
        row.rowIndex === rowIndex && row.suggestedCategory
          ? { ...row, category: row.suggestedCategory }
          : row
      )
    );
  }

  function applyAllSuggestions() {
    setPreviewRows((prev) =>
      prev.map((row) =>
        row.suggestedCategory ? { ...row, category: row.suggestedCategory } : row
      )
    );

    showToast('Applied all AI suggestions', 'success');
  }

  async function handleImport() {
    const selectedRows = previewRows.filter((r) => r.selected);

    if (selectedRows.length === 0) {
      showToast('Please select at least one transaction to import', 'error');
      return;
    }

    setStep('importing');

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const token = useAuthStore.getState().token;

      const res = await fetch(`${apiBase}/api/transactions/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          rows: selectedRows.map((row) => ({
            date: row.date,
            description: row.description,
            amount: row.amount,
            category: row.category,
          })),
        }),
      });

      if (!res.ok) throw new Error('Import failed');

      const result = await res.json();

      setImportResult({
        imported: result.imported || selectedRows.length,
        skipped: result.skipped || 0,
      });

      setStep('complete');
      showToast(`Successfully imported ${result.imported} transactions!`, 'success');
    } catch (err) {
      console.error('Error importing:', err);
      showToast('Import failed', 'error');
      setStep('preview');
    }
  }

  // ============================================================================
  // Reset
  // ============================================================================

  function resetImport() {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setHeaderMapping({});
    setPreviewRows([]);
    setStats({ total: 0, duplicates: 0, selected: 0, categorized: 0 });
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <FeatureGate feature="csvImportV2">
      <div className="csv-import-page">
        <header className="page-header">
          <h1>Import Transactions</h1>
          <p className="subtitle">Upload CSV with AI-powered categorization</p>
        </header>

        {/* Progress Steps */}
        <div className="import-steps">
          <div className={`step ${step === 'upload' ? 'active' : ''} ${['map-headers', 'preview', 'importing', 'complete'].includes(step) ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Upload File</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'map-headers' ? 'active' : ''} ${['preview', 'importing', 'complete'].includes(step) ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Map Headers</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'preview' ? 'active' : ''} ${['importing', 'complete'].includes(step) ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Preview & Import</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="import-content">
          {step === 'upload' && (
            <UploadStep
              file={file}
              accounts={accounts}
              selectedAccount={selectedAccount}
              onFileSelect={handleFileSelect}
              onAccountChange={setSelectedAccount}
              onUpload={handleUpload}
              fileInputRef={fileInputRef}
            />
          )}

          {step === 'map-headers' && (
            <MapHeadersStep
              headers={headers}
              headerMapping={headerMapping}
              csvData={csvData}
              onMappingChange={handleHeaderMappingChange}
              onNext={handleMapHeaders}
              onBack={() => setStep('upload')}
            />
          )}

          {step === 'preview' && (
            <PreviewStep
              rows={previewRows}
              stats={stats}
              onToggleRow={toggleRowSelection}
              onToggleAll={toggleSelectAll}
              onApplySuggestion={applySuggestedCategory}
              onApplyAllSuggestions={applyAllSuggestions}
              onImport={handleImport}
              onBack={() => setStep('map-headers')}
            />
          )}

          {step === 'importing' && (
            <div className="importing-state">
              <div className="spinner large" />
              <h2>Importing transactions...</h2>
              <p>Please wait while we process your data</p>
            </div>
          )}

          {step === 'complete' && importResult && (
            <CompleteStep
              imported={importResult.imported}
              skipped={importResult.skipped}
              onReset={resetImport}
            />
          )}
        </div>
      </div>
    </FeatureGate>
  );
}

// ============================================================================
// Upload Step
// ============================================================================

interface UploadStepProps {
  file: File | null;
  accounts: Account[];
  selectedAccount: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAccountChange: (accountId: string) => void;
  onUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function UploadStep({
  file,
  accounts,
  selectedAccount,
  onFileSelect,
  onAccountChange,
  onUpload,
  fileInputRef,
}: UploadStepProps) {
  return (
    <div className="upload-step">
      <div className="upload-card">
        <h2>Select Account</h2>
        <select
          value={selectedAccount}
          onChange={(e) => onAccountChange(e.target.value)}
          className="account-select"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.type})
            </option>
          ))}
        </select>

        <h2>Upload CSV File</h2>
        <div className="file-drop-zone">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="file-input"
          />
          <div className="file-drop-content">
            {file ? (
              <>
                <div className="file-icon">📄</div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              </>
            ) : (
              <>
                <div className="upload-icon">⬆️</div>
                <p className="upload-text">Click to select CSV file</p>
                <p className="upload-hint">or drag and drop here</p>
              </>
            )}
          </div>
        </div>

        <div className="csv-format-hint">
          <h3>CSV Format Requirements:</h3>
          <ul>
            <li>First row must contain headers</li>
            <li>Required columns: Date, Description, Amount</li>
            <li>Optional: Category (will be auto-suggested by AI)</li>
            <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
          </ul>
        </div>

        <button
          onClick={onUpload}
          disabled={!file || !selectedAccount}
          className="btn-primary btn-large"
        >
          Next: Map Headers
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Map Headers Step
// ============================================================================

interface MapHeadersStepProps {
  headers: string[];
  headerMapping: HeaderMapping;
  csvData: string[][];
  onMappingChange: (field: keyof HeaderMapping, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function MapHeadersStep({
  headers,
  headerMapping,
  csvData,
  onMappingChange,
  onNext,
  onBack,
}: MapHeadersStepProps) {
  const sampleRow = csvData[0] || [];

  return (
    <div className="map-headers-step">
      <div className="mapping-card">
        <h2>Map CSV Columns</h2>
        <p className="subtitle">Match your CSV headers to transaction fields</p>

        <div className="mapping-grid">
          {/* Date */}
          <div className="mapping-row">
            <label className="mapping-label required">Date</label>
            <select
              value={headerMapping.date ?? ''}
              onChange={(e) => onMappingChange('date', e.target.value)}
              className="mapping-select"
            >
              <option value="">-- Select Column --</option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <div className="mapping-sample">
              {headerMapping.date !== undefined && sampleRow[headerMapping.date]}
            </div>
          </div>

          {/* Description */}
          <div className="mapping-row">
            <label className="mapping-label required">Description</label>
            <select
              value={headerMapping.description ?? ''}
              onChange={(e) => onMappingChange('description', e.target.value)}
              className="mapping-select"
            >
              <option value="">-- Select Column --</option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <div className="mapping-sample">
              {headerMapping.description !== undefined &&
                sampleRow[headerMapping.description]}
            </div>
          </div>

          {/* Amount */}
          <div className="mapping-row">
            <label className="mapping-label required">Amount</label>
            <select
              value={headerMapping.amount ?? ''}
              onChange={(e) => onMappingChange('amount', e.target.value)}
              className="mapping-select"
            >
              <option value="">-- Select Column --</option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <div className="mapping-sample">
              {headerMapping.amount !== undefined && sampleRow[headerMapping.amount]}
            </div>
          </div>

          {/* Category */}
          <div className="mapping-row">
            <label className="mapping-label optional">Category (Optional)</label>
            <select
              value={headerMapping.category ?? ''}
              onChange={(e) => onMappingChange('category', e.target.value)}
              className="mapping-select"
            >
              <option value="">-- Select Column or Skip --</option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
            <div className="mapping-sample">
              {headerMapping.category !== undefined && sampleRow[headerMapping.category]}
            </div>
          </div>
        </div>

        <div className="mapping-actions">
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
          <button
            onClick={onNext}
            disabled={
              headerMapping.date === undefined ||
              headerMapping.description === undefined ||
              headerMapping.amount === undefined
            }
            className="btn-primary"
          >
            Next: Preview Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Step
// ============================================================================

interface PreviewStepProps {
  rows: PreviewRow[];
  stats: ImportStats;
  onToggleRow: (rowIndex: number) => void;
  onToggleAll: () => void;
  onApplySuggestion: (rowIndex: number) => void;
  onApplyAllSuggestions: () => void;
  onImport: () => void;
  onBack: () => void;
}

function PreviewStep({
  rows,
  stats,
  onToggleRow,
  onToggleAll,
  onApplySuggestion,
  onApplyAllSuggestions,
  onImport,
  onBack,
}: PreviewStepProps) {
  const hasSuggestions = rows.some((r) => r.suggestedCategory && r.suggestedCategory !== r.category);

  return (
    <div className="preview-step">
      {/* Stats */}
      <div className="preview-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Rows</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.selected}</div>
          <div className="stat-label">Selected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.duplicates}</div>
          <div className="stat-label">Duplicates</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{stats.categorized}</div>
          <div className="stat-label">AI Categorized</div>
        </div>
      </div>

      {/* Actions */}
      <div className="preview-actions">
        <button onClick={onToggleAll} className="btn-secondary">
          Toggle All (Non-Duplicates)
        </button>
        {hasSuggestions && (
          <button onClick={onApplyAllSuggestions} className="btn-ai">
            🤖 Apply All AI Suggestions
          </button>
        )}
      </div>

      {/* Preview Table */}
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              <th className="col-select">Select</th>
              <th className="col-date">Date</th>
              <th className="col-description">Description</th>
              <th className="col-amount">Amount</th>
              <th className="col-category">Category</th>
              <th className="col-actions">AI Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={`${row.isDuplicate ? 'duplicate-row' : ''} ${row.selected ? 'selected-row' : ''}`}
              >
                <td className="col-select">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => onToggleRow(row.rowIndex)}
                    disabled={row.isDuplicate}
                  />
                </td>
                <td className="col-date">{row.date}</td>
                <td className="col-description">
                  {row.description}
                  {row.isDuplicate && (
                    <span className="duplicate-badge">Duplicate</span>
                  )}
                </td>
                <td className="col-amount">${row.amount.toFixed(2)}</td>
                <td className="col-category">
                  {row.category || <span className="no-category">No category</span>}
                </td>
                <td className="col-actions">
                  {row.suggestedCategory && row.suggestedCategory !== row.category && (
                    <div className="ai-suggestion">
                      <span className="suggestion-text">
                        {row.suggestedCategory}
                        {row.categoryScore && (
                          <span className="confidence">
                            {Math.round(row.categoryScore * 100)}%
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => onApplySuggestion(row.rowIndex)}
                        className="btn-apply-suggestion"
                        title="Apply AI suggestion"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                  {row.suggestedCategory === row.category && (
                    <span className="suggestion-applied">✓ Applied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Actions */}
      <div className="import-actions">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onImport}
          disabled={stats.selected === 0}
          className="btn-primary btn-large"
        >
          Import {stats.selected} Transactions
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Complete Step
// ============================================================================

interface CompleteStepProps {
  imported: number;
  skipped: number;
  onReset: () => void;
}

function CompleteStep({ imported, skipped, onReset }: CompleteStepProps) {
  return (
    <div className="complete-step">
      <div className="success-icon">✓</div>
      <h2>Import Complete!</h2>
      <div className="import-summary">
        <p>
          <strong>{imported}</strong> transactions imported successfully
        </p>
        {skipped > 0 && (
          <p className="skipped">
            {skipped} duplicates skipped
          </p>
        )}
      </div>
      <div className="complete-actions">
        <button onClick={onReset} className="btn-primary">
          Import Another File
        </button>
        <a href="/transactions" className="btn-secondary">
          View Transactions
        </a>
      </div>
    </div>
  );
}
