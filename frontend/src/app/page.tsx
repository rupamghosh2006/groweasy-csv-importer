'use client';

import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';
import Papa from 'papaparse';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiBriefcase,
  FiChevronRight,
  FiDatabase,
  FiFileText,
  FiGrid,
  FiLink2,
  FiMessageSquare,
  FiMoreHorizontal,
  FiMoon,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiSun,
  FiUpload,
  FiUsers,
  FiWifi,
  FiX,
  FiZap,
} from 'react-icons/fi';
import type { ImportResponse, Step } from '@/lib/types';
import DropZone from '@/components/DropZone';
import PreviewTable from '@/components/PreviewTable';
import ResultsView from '@/components/ResultsView';
import { useTheme } from '@/components/ThemeProvider';

type NavItem = {
  label: string;
  icon: IconType;
  active?: boolean;
};

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: FiGrid },
      { label: 'Generate Leads', icon: FiZap },
      { label: 'Manage Leads', icon: FiDatabase },
      { label: 'Engage Leads', icon: FiMessageSquare },
    ],
  },
  {
    title: 'Control Center',
    items: [
      { label: 'Team Members', icon: FiUsers },
      { label: 'Lead Sources', icon: FiActivity, active: true },
      { label: 'Ad Accounts', icon: FiBarChart2 },
      { label: 'WhatsApp Account', icon: FiMessageSquare },
      { label: 'Tele Calling', icon: FiPhone },
      { label: 'CRM Fields', icon: FiDatabase },
      { label: 'API Center', icon: FiWifi },
    ],
  },
];

const leadSourceCards = [
  {
    name: 'Google Ads',
    detail: 'Account sync',
    color: '#4285f4',
    status: 'Not Connected',
    icon: 'G',
    logoSvg: (
      <svg viewBox="0 0 48 48" className="w-6 h-6">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.59l7.98-6z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6C6.51 42.62 14.62 48 24 48z" />
      </svg>
    ),
  },
  {
    name: 'Facebook Leads',
    detail: 'Lead form import',
    color: '#1877f2',
    status: 'Not Connected',
    icon: 'f',
    logoSvg: (
      <svg viewBox="0 0 48 48" className="w-6 h-6">
        <path fill="#1877F2" d="M24 0C10.74 0 0 10.74 0 24c0 13.26 10.74 24 24 24s24-10.74 24-24C48 10.74 37.26 0 24 0z" />
        <path fill="#fff" d="M26.3 25.3h3.4l.6-4.5h-4v-2.9c0-1.3.4-2.2 2.2-2.2h2.4v-4c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 5.9v3.3h-3.7v4.5h3.7V37h4.6V25.3z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp Business',
    detail: 'Conversation leads',
    color: '#22c55e',
    status: 'Not Connected',
    icon: 'W',
    logoSvg: (
      <svg viewBox="0 0 48 48" className="w-6 h-6">
        <path fill="#25D366" d="M24 0C10.74 0 0 10.74 0 24c0 5.16 1.63 9.93 4.4 13.82L2.4 45.6l7.93-1.98C14.17 45.97 18.96 48 24 48c13.26 0 24-10.74 24-24S37.26 0 24 0z" />
        <path fill="#fff" d="M34.8 28.3c-.5-.3-3.1-1.5-3.6-1.7-.5-.2-.8-.3-1.2.3-.4.5-1.4 1.7-1.7 2-.3.4-.6.4-1.1.1-.5-.3-2-.7-3.8-2.3-1.4-1.2-2.4-2.7-2.7-3.1-.3-.4 0-.6.2-.8.2-.2.5-.5.7-.8.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8-.1-.2-1.2-2.9-1.6-3.9-.4-1-.8-.9-1.1-.9h-1c-.4 0-1 .1-1.5.8-.5.7-2 2-2 4.9s2.1 5.7 2.4 6.1c.3.4 4.1 6.3 10 8.8 1.4.6 2.5 1 3.4 1.3 1.4.4 2.7.4 3.7.2 1.1-.2 3.4-1.4 3.9-2.7.5-1.4.5-2.5.3-2.8-.1-.2-.4-.3-.9-.6z" />
      </svg>
    ),
  },
  {
    name: 'Telephony',
    detail: 'Call center leads',
    color: '#0f766e',
    status: 'Not Connected',
    icon: 'T',
    logoSvg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [importerOpen, setImporterOpen] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');

  const reset = useCallback((openImporter = true) => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setError('');
    setProgress('');
    setParsing(false);
    setImporting(false);
    setStep('upload');
    setImporterOpen(openImporter);
  }, []);

  const handleFile = useCallback((selectedFile: File | null) => {
    setError('');
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      setHeaders([]);
      setRows([]);
      setStep('upload');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      setFile(null);
      setHeaders([]);
      setRows([]);
      setStep('upload');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setImporterOpen(true);

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        setParsing(false);

        if (results.errors.length > 0 && results.data.length === 0) {
          setError('Could not parse this CSV file. Please check the file and try again.');
          setStep('upload');
          return;
        }

        const parsedRows = results.data.filter((row) =>
          Object.values(row).some((value) => String(value ?? '').trim().length > 0)
        );
        const parsedHeaders = results.meta.fields ?? [];

        if (parsedRows.length === 0 || parsedHeaders.length === 0) {
          setError('This CSV looks empty. Please upload a file with headers and lead rows.');
          setStep('upload');
          return;
        }

        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setStep('preview');
      },
      error() {
        setParsing(false);
        setError('Failed to parse CSV. Please upload another file.');
        setStep('upload');
      },
    });
  }, []);

  const handleImport = async () => {
    if (rows.length === 0) {
      setError('Upload a CSV before importing leads.');
      return;
    }

    setError('');
    setImporting(true);
    setProgress('Mapping fields with AI...');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${apiUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Import failed');
      }

      const data: ImportResponse = await res.json();
      setResult(data);
      setStep('result');
      setImporterOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  const closeImporter = () => {
    if (!importing) {
      reset(false);
    }
  };

  const openImporter = () => {
    reset(true);
  };

  return (
    <div className="ge-app-shell">
      <Sidebar />
      <div className="ge-workspace">
        <MobileHeader onImport={openImporter} />
        {step === 'result' && result ? (
          <ManageLeadsPage result={result} onImportAnother={openImporter} />
        ) : (
          <LeadSourcesPage
            file={file}
            rows={rows.length}
            onOpenImporter={() => setImporterOpen(true)}
          />
        )}
      </div>

      {importerOpen && step !== 'result' && (
        <ImportDialog
          step={step}
          file={file}
          headers={headers}
          rows={rows}
          parsing={parsing}
          importing={importing}
          progress={progress}
          error={error}
          onClose={closeImporter}
          onFile={handleFile}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="ge-sidebar" aria-label="GrowEasy navigation">
      <div className="ge-sidebar-header">
        <div className="ge-brand">
          <GrowEasyMark />
          <span>GrowEasy</span>
        </div>
        <ThemeToggle />
      </div>

      <button className="ge-account-switcher" type="button">
        <span className="ge-account-avatar">VK</span>
        <span className="ge-account-copy">
          <strong>VK Test</strong>
          <small>Owner</small>
        </span>
        <FiChevronRight aria-hidden="true" />
      </button>

      <nav className="ge-nav">
        {navSections.map((section) => (
          <div className="ge-nav-section" key={section.title}>
            <p>{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={`ge-nav-item${item.active ? ' is-active' : ''}`}
                  key={item.label}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <button className="ge-business-center" type="button">
        <FiBriefcase aria-hidden="true" />
        <span>Business Center</span>
      </button>
    </aside>
  );
}

function MobileHeader({ onImport }: { onImport: () => void }) {
  return (
    <header className="ge-mobile-header">
      <div className="ge-brand">
        <GrowEasyMark />
        <span>GrowEasy</span>
      </div>
      <div className="ge-mobile-actions">
        <ThemeToggle />
        <button className="ge-icon-button" type="button" onClick={onImport} aria-label="Import leads">
          <FiUpload aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? FiSun : FiMoon;

  return (
    <button className="ge-theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </button>
  );
}

function LeadSourcesPage({
  file,
  rows,
  onOpenImporter,
}: {
  file: File | null;
  rows: number;
  onOpenImporter: () => void;
}) {
  return (
    <main className="ge-page">
      <PageHeader
        title="Lead Sources"
        description="Connect, manage, and control all your lead channels from one dashboard."
      >
        <button className="ge-icon-button" type="button" aria-label="Lead source settings">
          <FiSettings aria-hidden="true" />
        </button>
      </PageHeader>

      <section className="ge-source-actions" aria-label="Lead source actions">
        <button className="ge-import-source" type="button" onClick={onOpenImporter}>
          <span className="ge-source-icon">
            <FiUpload aria-hidden="true" />
          </span>
          <span>
            <strong>Import Leads via CSV</strong>
            <small>
              {file && rows > 0
                ? `${file.name} is ready with ${rows} parsed rows`
                : 'Upload and map messy lead exports'}
            </small>
          </span>
        </button>

        <button className="ge-manual-source" type="button">
          <span className="ge-source-icon muted">
            <FiPlus aria-hidden="true" />
          </span>
          <span>
            <strong>Add Single Lead</strong>
            <small>Manually create and assign a new lead</small>
          </span>
        </button>
      </section>

      <section className="ge-section">
        <div className="ge-section-heading">
          <div>
            <h2>Active Lead Sources</h2>
            <p>Connect inbound channels before routing leads to the CRM.</p>
          </div>
          <button className="ge-text-button" type="button">
            <FiRefreshCw aria-hidden="true" />
            Sync
          </button>
        </div>

        <div className="ge-provider-grid">
          {leadSourceCards.map((source) => (
            <article className="ge-provider-card" key={source.name}>
              <div className="ge-provider-head">
                <span className="ge-provider-logo" style={{ '--source-color': source.color } as SourceStyle}>
                  {source.logoSvg}
                </span>
                <button className="ge-more-button" type="button" aria-label={`More actions for ${source.name}`}>
                  <FiMoreHorizontal aria-hidden="true" />
                </button>
              </div>
              <div>
                <h3>{source.name}</h3>
                <p>{source.detail}</p>
              </div>
              <div className="ge-provider-status">
                <span>
                  <strong>{source.status}</strong>
                  <small>Inactive</small>
                </span>
                <button className="ge-connect-button" type="button">
                  <FiLink2 aria-hidden="true" />
                  Connect
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ManageLeadsPage({
  result,
  onImportAnother,
}: {
  result: ImportResponse;
  onImportAnother: () => void;
}) {
  return (
    <main className="ge-page">
      <PageHeader
        title="Manage Your Leads"
        description="Monitor lead status, assign tasks, and close deals faster."
      >
        <button className="ge-secondary-action" type="button" onClick={onImportAnother}>
          <FiUpload aria-hidden="true" />
          Import more
        </button>
      </PageHeader>

      <ResultsView result={result} />
    </main>
  );
}

function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="ge-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="ge-page-actions">{children}</div>
    </header>
  );
}

function ImportDialog({
  step,
  file,
  headers,
  rows,
  parsing,
  importing,
  progress,
  error,
  onClose,
  onFile,
  onImport,
}: {
  step: Step;
  file: File | null;
  headers: string[];
  rows: Record<string, string>[];
  parsing: boolean;
  importing: boolean;
  progress: string;
  error: string;
  onClose: () => void;
  onFile: (file: File | null) => void;
  onImport: () => void;
}) {
  const hasPreview = step === 'preview' && file;

  return (
    <div className="ge-modal-scrim">
      <section
        className={`ge-import-modal${hasPreview ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
      >
        <button
          className="ge-modal-close"
          type="button"
          onClick={onClose}
          disabled={importing}
          aria-label="Close importer"
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="ge-modal-header">
          <h2 id="import-title">Import Leads via CSV</h2>
          <p>Upload a CSV file to bulk import leads into your system.</p>
        </div>

        {hasPreview ? (
          <div className="ge-preview-panel">
            <FileSummary file={file} onRemove={() => onFile(null)} disabled={importing} />
            <PreviewTable headers={headers} rows={rows} />
          </div>
        ) : (
          <DropZone onFile={onFile} file={file} loading={parsing} />
        )}

        {parsing && (
          <div className="ge-processing-line" role="status">
            <span />
            Parsing CSV...
          </div>
        )}

        {importing && (
          <div className="ge-processing-line" role="status">
            <span />
            {progress || 'Processing leads...'}
          </div>
        )}

        {error && (
          <div className="ge-error-banner" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="ge-modal-actions">
          <button className="ge-button ge-button-secondary" type="button" onClick={onClose} disabled={importing}>
            Cancel
          </button>
          <button
            className="ge-button ge-button-primary"
            type="button"
            onClick={hasPreview ? onImport : undefined}
            disabled={!hasPreview || importing || parsing}
          >
            {importing ? 'Processing...' : 'Upload File'}
          </button>
        </div>
      </section>
    </div>
  );
}

function FileSummary({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="ge-file-summary">
      <span className="ge-file-icon">
        <FiFileText aria-hidden="true" />
      </span>
      <span className="ge-file-copy">
        <strong>{file.name}</strong>
        <small>{(file.size / 1024).toFixed(1)} KB</small>
      </span>
      <button type="button" onClick={onRemove} disabled={disabled} aria-label="Remove selected CSV">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

function GrowEasyMark() {
  return (
    <svg viewBox="0 0 212 212" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="204" height="204" rx="44" fill="var(--ge-mark-bg)" />
      <path d="M153.5 102.3 28.3 227.4-11.2 187.9 114 62.7l39.5 39.6Z" fill="var(--ge-mark-fg)" />
      <path d="M40.5 62.7h113v39.6h-113V62.7Z" fill="var(--ge-mark-fg)" />
      <path d="M153.5 62.7v113h-39.6v-113h39.6Z" fill="var(--ge-mark-fg)" />
    </svg>
  );
}

type SourceStyle = CSSProperties & {
  '--source-color': string;
};
