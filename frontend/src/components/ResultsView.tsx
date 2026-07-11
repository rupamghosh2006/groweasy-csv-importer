'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiDownload, FiMoreHorizontal, FiRefreshCw, FiSearch } from 'react-icons/fi';
import type { CrmRecord, CrmStatus, ImportResponse } from '@/lib/types';

const crmHeaders = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
] as const;

const statusLabels: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Good Lead',
  DID_NOT_CONNECT: 'Not Dialed',
  BAD_LEAD: 'Bad Lead',
  SALE_DONE: 'Sale Done',
  '': 'Not Dialed',
};

const statusClasses: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'is-good',
  DID_NOT_CONNECT: 'is-neutral',
  BAD_LEAD: 'is-bad',
  SALE_DONE: 'is-sale',
  '': 'is-neutral',
};

export default function ResultsView({ result }: { result: ImportResponse }) {
  const [showSkipped, setShowSkipped] = useState(false);

  const downloadCSV = () => {
    const headers = crmHeaders.join(',');
    const rows = result.imported.map((record) =>
      crmHeaders
        .map((header) => {
          const value = String(record[header] ?? '');
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'groweasy_imported_leads.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ge-results">
      <section className="ge-metrics-grid" aria-label="Import summary">
        <MetricCard label="Imported" value={result.totalImported} />
        <MetricCard label="Skipped" value={result.totalSkipped} tone="warning" />
        <MetricCard label="Total Processed" value={result.totalRows} />
        <MetricCard label="Success Rate" value={`${getSuccessRate(result)}%`} tone="success" />
      </section>

      <section className="ge-section">
        <div className="ge-leads-toolbar">
          <div>
            <h2>Your Leads</h2>
            <p>{result.totalImported} CRM-ready records extracted from the uploaded CSV.</p>
          </div>
          <div className="ge-toolbar-actions">
            <label className="ge-search-box">
              <FiSearch aria-hidden="true" />
              <input placeholder="Enter email or phone number..." readOnly />
            </label>
            <button className="ge-icon-button dark" type="button" aria-label="Refresh leads">
              <FiRefreshCw aria-hidden="true" />
            </button>
            <button className="ge-secondary-action" type="button" onClick={downloadCSV}>
              <FiDownload aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="ge-table-frame is-leads">
          <table className="ge-data-table ge-leads-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Date Created</th>
                <th>Company</th>
                <th>Status</th>
                <th>Source</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.imported.map((record, index) => (
                <LeadRow record={record} key={`${record.email}-${record.mobile_without_country_code}-${index}`} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {result.skipped.length > 0 && (
        <section className="ge-skipped-section">
          <button
            type="button"
            className="ge-skipped-toggle"
            onClick={() => setShowSkipped((current) => !current)}
          >
            <span>Skipped Records ({result.skipped.length})</span>
            {showSkipped ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
          </button>

          {showSkipped && (
            <div className="ge-skipped-list">
              {result.skipped.map((skipped, index) => (
                <article className="ge-skipped-item" key={`${skipped.reason}-${index}`}>
                  <strong>Reason: {skipped.reason}</strong>
                  <pre>{JSON.stringify(skipped.original_row, null, 2)}</pre>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <article className={`ge-metric-card is-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function LeadRow({ record }: { record: CrmRecord }) {
  const status: CrmStatus = record.crm_status || '';
  const contact = [record.country_code, record.mobile_without_country_code].filter(Boolean).join(' ');

  return (
    <tr>
      <td>
        <strong>{record.name || 'Unnamed Lead'}</strong>
      </td>
      <td title={record.email}>{record.email || '-'}</td>
      <td>{contact || '-'}</td>
      <td>{formatDate(record.created_at)}</td>
      <td>{record.company || '-'}</td>
      <td>
        <span className={`ge-status-pill ${statusClasses[status] ?? statusClasses['']}`}>
          {statusLabels[status] ?? statusLabels['']}
        </span>
      </td>
      <td>{record.data_source ? record.data_source.replace(/_/g, ' ') : '-'}</td>
      <td title={record.crm_note || record.description}>{record.crm_note || record.description || '-'}</td>
      <td>
        <button className="ge-row-action" type="button">
          More
          <FiMoreHorizontal aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSuccessRate(result: ImportResponse) {
  if (result.totalRows === 0) {
    return 0;
  }

  return Math.round((result.totalImported / result.totalRows) * 100);
}
