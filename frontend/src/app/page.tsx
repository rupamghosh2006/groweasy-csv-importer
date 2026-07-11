'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { Step, ImportResponse } from '@/lib/types';
import { FiSun, FiMoon, FiAlertCircle } from 'react-icons/fi';
import { useTheme } from '@/components/ThemeProvider';
import StepIndicator from '@/components/StepIndicator';
import DropZone from '@/components/DropZone';
import PreviewTable from '@/components/PreviewTable';
import ResultsView from '@/components/ResultsView';

export default function Home() {
  const { theme, toggle } = useTheme();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');

  const handleFile = useCallback((f: File | null) => {
    setError('');
    setResult(null);
    if (!f) {
      setFile(null);
      setHeaders([]);
      setRows([]);
      setStep('upload');
      return;
    }
    if (!f.name.endsWith('.csv')) {
      setError('Please select a .csv file');
      return;
    }
    setFile(f);
    setParsing(true);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        setParsing(false);
        if (results.errors.length > 0 && results.data.length === 0) {
          setError('Could not parse CSV file');
          return;
        }
        const parsedRows = results.data as Record<string, string>[];
        const hdrs = results.meta.fields || [];
        setHeaders(hdrs);
        setRows(parsedRows);
        setStep('preview');
      },
      error() {
        setParsing(false);
        setError('Failed to parse CSV');
      },
    });
  }, []);

  const handleImport = async () => {
    setError('');
    setImporting(true);
    setProgress('Starting import...');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${apiUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import failed');
      }

      const data: ImportResponse = await res.json();
      setResult(data);
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setError('');
    setStep('upload');
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0f1a1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 212 212" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="204" height="204" rx="44" stroke="#294744" stroke-width="12"/>
              <path d="M153.512 102.25L28.3282 227.434L-11.2302 187.876L113.953 62.6921L153.512 102.25Z" fill="#294744"/>
              <path d="M40.5302 62.6965H153.503V102.257H40.5302V62.6965Z" fill="#294744"/>
              <path d="M153.503 62.6965V175.67H113.942L113.942 62.6965L153.503 62.6965Z" fill="#294744"/>
            </svg>
            <span className="font-semibold text-sm text-[#294744] dark:text-[#4a9e9a]">GrowEasy</span>
          </div>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {step !== 'upload' && (
          <StepIndicator current={step} />
        )}

        <div className="step-card rounded-2xl p-6 sm:p-8 shadow-sm">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Import CSV to CRM
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Upload any CSV file — Facebook Leads, Google Ads, spreadsheets — and we&apos;ll map it to your CRM automatically.
                </p>
              </div>
              <DropZone onFile={handleFile} file={file} loading={parsing} />
              {parsing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="w-5 h-5 border-2 border-[#294744] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">Parsing CSV...</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preview Data</h2>
                  <p className="text-xs text-gray-500">{file?.name} &middot; {rows.length} rows &middot; {headers.length} columns</p>
                </div>
                <button
                  onClick={() => setStep('confirm')}
                  className="px-5 py-2 bg-[#294744] text-white text-sm font-medium rounded-xl hover:bg-[#1a2d2b] transition-colors"
                >
                  Continue
                </button>
              </div>
              <PreviewTable headers={headers} rows={rows} />
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Import</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {rows.length} rows will be processed through AI mapping. This may take a moment.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2.5 bg-[#294744] text-white text-sm font-medium rounded-xl hover:bg-[#1a2d2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Processing...' : 'Confirm & Import'}
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={importing}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              </div>
              {importing && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-6 h-6 border-2 border-[#294744] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">{progress}</span>
                  <p className="text-xs text-gray-400">Sending batches to Gemini AI for intelligent field mapping...</p>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400 text-left">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Complete</h2>
                <button
                  onClick={reset}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Import Another
                </button>
              </div>
              <ResultsView result={result} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400">
        GrowEasy AI-Powered CSV Importer
      </footer>
    </div>
  );
}
