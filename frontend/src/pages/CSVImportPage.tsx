/**
 * CSV Import v2 - Sprint-1
 * 
 * Enhanced CSV import with:
 * - AI-powered category suggestions
 * - Duplicate detection
 * - Header mapping
 * - Preview before import
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui';
import { Page, PageHeader, PageContent } from '@/components/layout/Page';
import { Stepper, Step } from '@/components/ui/stepper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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
  useEffect(() => {
    loadAccounts();
  }, []);

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
  
  // Map step string to number for Stepper
  const stepNumber = {
    'upload': 1,
    'map-headers': 2,
    'preview': 3,
    'importing': 3,
    'complete': 3,
  }[step];

  return (
    <FeatureGate feature="csvImportV2">
      <Page>
        <PageHeader
          title="Import Transactions"
          description="Upload CSV with AI-powered categorization"
        />

        <PageContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <Stepper currentStep={stepNumber}>
              <Step stepNumber={1} title="Upload File" description="Select CSV file and account" />
              <Step stepNumber={2} title="Map Headers" description="Match columns to fields" />
              <Step stepNumber={3} title="Preview & Import" description="Review and import" />
            </Stepper>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Importing transactions...</h2>
                  <p className="text-muted-foreground">Please wait while we process your data</p>
                </CardContent>
              </Card>
            )}

            {step === 'complete' && importResult && (
              <CompleteStep
                imported={importResult.imported}
                skipped={importResult.skipped}
                onReset={resetImport}
              />
            )}
          </div>
        </PageContent>
      </Page>
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
    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Account</CardTitle>
          <CardDescription>Choose the account to import transactions into</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAccount} onValueChange={onAccountChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>Select a CSV file containing your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-primary/50 transition-colors">
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-primary mb-3" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground">Click to select CSV file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop here</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Requirements Card - Full Width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              First row must contain headers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Required columns: Date, Description, Amount
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Optional: Category (will be auto-suggested by AI)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Date format: YYYY-MM-DD or MM/DD/YYYY
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Footer - Full Width */}
      <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {!selectedAccount && !file && 'Select an account and upload a CSV file to continue'}
          {!selectedAccount && file && 'Select an account to continue'}
          {selectedAccount && !file && 'Upload a CSV file to continue'}
          {selectedAccount && file && 'Ready to map your CSV columns'}
        </p>
        <Button
          onClick={onUpload}
          disabled={!file || !selectedAccount}
          size="lg"
        >
          Next: Map Headers
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
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
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Columns</CardTitle>
        <CardDescription>Match your CSV headers to transaction fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Date <span className="text-destructive">*</span>
            </Label>
            <Select
              value={headerMapping.date?.toString() ?? ''}
              onValueChange={(value) => onMappingChange('date', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headerMapping.date !== undefined && (
              <p className="text-xs text-muted-foreground">Sample: {sampleRow[headerMapping.date]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Description <span className="text-destructive">*</span>
            </Label>
            <Select
              value={headerMapping.description?.toString() ?? ''}
              onValueChange={(value) => onMappingChange('description', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headerMapping.description !== undefined && (
              <p className="text-xs text-muted-foreground">Sample: {sampleRow[headerMapping.description]}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Select
              value={headerMapping.amount?.toString() ?? ''}
              onValueChange={(value) => onMappingChange('amount', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headerMapping.amount !== undefined && (
              <p className="text-xs text-muted-foreground">Sample: {sampleRow[headerMapping.amount]}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <Select
              value={headerMapping.category?.toString() ?? ''}
              onValueChange={(value) => onMappingChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column or skip" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headerMapping.category !== undefined && (
              <p className="text-xs text-muted-foreground">Sample: {sampleRow[headerMapping.category]}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={
              headerMapping.date === undefined ||
              headerMapping.description === undefined ||
              headerMapping.amount === undefined
            }
          >
            Next: Preview Transactions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{stats.selected}</div>
            <p className="text-sm text-muted-foreground">Selected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{stats.duplicates}</div>
            <p className="text-sm text-muted-foreground">Duplicates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.categorized}</div>
            <p className="text-sm text-muted-foreground">AI Categorized</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onToggleAll}>
          Toggle All (Non-Duplicates)
        </Button>
        {hasSuggestions && (
          <Button variant="secondary" onClick={onApplyAllSuggestions}>
            🤖 Apply All AI Suggestions
          </Button>
        )}
      </div>

      {/* Preview Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Select</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">AI Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b transition-colors ${row.isDuplicate ? 'bg-destructive/10 opacity-60' : ''} ${row.selected && !row.isDuplicate ? 'bg-primary/5' : ''} hover:bg-muted/50`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={() => onToggleRow(row.rowIndex)}
                        disabled={row.isDuplicate}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.description}
                        {row.isDuplicate && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive text-destructive-foreground">
                            Duplicate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">${row.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {row.category || <span className="text-muted-foreground">No category</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.suggestedCategory && row.suggestedCategory !== row.category ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {row.suggestedCategory}
                            {row.categoryScore && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({Math.round(row.categoryScore * 100)}%)
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApplySuggestion(row.rowIndex)}
                            className="h-6 px-2"
                          >
                            ✓
                          </Button>
                        </div>
                      ) : row.suggestedCategory === row.category ? (
                        <span className="text-green-600 text-sm">✓ Applied</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Import Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onImport}
          disabled={stats.selected === 0}
          size="lg"
        >
          Import {stats.selected} Transactions
        </Button>
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
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
        <div className="text-muted-foreground mb-6 space-y-1">
          <p>
            <span className="font-semibold text-foreground">{imported}</span> transactions imported successfully
          </p>
          {skipped > 0 && (
            <p className="text-sm">
              {skipped} duplicates skipped
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onReset}>
            Import Another File
          </Button>
          <Button onClick={() => navigate('/transactions')}>
            View Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
