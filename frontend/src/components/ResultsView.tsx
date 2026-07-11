'use client';

import type { ImportResponse, CrmRecord, CrmStatus } from '@/lib/types';
import { FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useState } from 'react';

const statusColors: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  DID_NOT_CONNECT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  BAD_LEAD: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  SALE_DONE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  '': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const crmHeaders = ['created_at', 'name', 'email', 'country_code', 'mobile_without_country_code', 'company', 'city', 'state', 'country', 'lead_owner', 'crm_status', 'crm_note', 'data_source', 'possession_time', 'description'] as const;

export default function ResultsView({ result }: { result: ImportResponse }) {
  const [showSkipped, setShowSkipped] = useState(false);

  const downloadCSV = () => {
    const headers = crmHeaders.join(',');
    const rows = result.imported.map((r) =>
      (crmHeaders as readonly (keyof CrmRecord)[]).map((h) => {
        const val = r[h] ?? '';
        const escaped = val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val;
        return escaped;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imported-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-[#1a2a2a] border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-[#294744] dark:text-[#4a9e9a]">{result.totalImported}</p>
          <p className="text-xs text-gray-500 mt-1">Imported</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1a2a2a] border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{result.totalSkipped}</p>
          <p className="text-xs text-gray-500 mt-1">Skipped</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1a2a2a] border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{result.totalRows}</p>
          <p className="text-xs text-gray-500 mt-1">Total Processed</p>
        </div>
      </div>

      {result.imported.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Imported Leads</h3>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 text-xs font-medium text-[#294744] hover:text-[#1a2d2b] bg-[#294744]/10 hover:bg-[#294744]/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#294744] text-white">
                  <th className="sticky top-0 bg-[#294744] px-3 py-2.5 text-left font-medium whitespace-nowrap">#</th>
                  {crmHeaders.map((h) => (
                    <th key={h} className="sticky top-0 bg-[#294744] px-3 py-2.5 text-left font-medium whitespace-nowrap">
                      {h.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.imported.map((record, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    {(crmHeaders as readonly (keyof CrmRecord)[]).map((h, ci) => {
                      const val = record[h] ?? '';
                      if (h === 'crm_status') {
                        return (
                          <td key={`${h}-${ci}`} className="px-3 py-2">
                            {val ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[val as CrmStatus] || statusColors['']}`}>
                                {val.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      }
                      return (
                        <td key={`${h}-${ci}`} className="px-3 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis" title={val}>
                          {val || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.skipped.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#1a2a2a] border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className="flex items-center justify-between w-full px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Skipped Records ({result.skipped.length})
            </span>
            {showSkipped ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showSkipped && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-3 max-h-[400px] overflow-y-auto">
              {result.skipped.map((s, idx) => (
                <div key={idx} className="text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <p className="text-red-600 dark:text-red-400 font-medium text-xs mb-1">Reason: {s.reason}</p>
                  <pre className="text-xs text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(s.original_row, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
