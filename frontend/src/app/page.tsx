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
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSettings,
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
  },
  {
    name: 'Facebook Leads',
    detail: 'Lead form import',
    color: '#1877f2',
    status: 'Not Connected',
    icon: 'f',
  },
  {
    name: 'WhatsApp Business',
    detail: 'Conversation leads',
    color: '#22c55e',
    status: 'Not Connected',
    icon: 'W',
  },
  {
    name: 'Telephony',
    detail: 'Call center leads',
    color: '#0f766e',
    status: 'Not Connected',
    icon: 'T',
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
      <div className="ge-brand">
        <GrowEasyMark />
        <span>GrowEasy</span>
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
      <button className="ge-icon-button" type="button" onClick={onImport} aria-label="Import leads">
        <FiUpload aria-hidden="true" />
      </button>
    </header>
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
                  {source.icon}
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
      <rect x="4" y="4" width="204" height="204" rx="44" fill="#101513" />
      <path d="M153.5 102.3 28.3 227.4-11.2 187.9 114 62.7l39.5 39.6Z" fill="#fff" />
      <path d="M40.5 62.7h113v39.6h-113V62.7Z" fill="#fff" />
      <path d="M153.5 62.7v113h-39.6v-113h39.6Z" fill="#fff" />
    </svg>
  );
}

type SourceStyle = CSSProperties & {
  '--source-color': string;
};
