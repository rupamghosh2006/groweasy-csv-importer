'use client';

import { useCallback, useId, useState, type ChangeEvent, type DragEvent } from 'react';
import { FiDownload, FiFileText, FiInfo, FiUpload } from 'react-icons/fi';

interface DropZoneProps {
  onFile: (file: File | null) => void;
  file: File | null;
  loading: boolean;
}

const templateCsv = [
  'created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description',
  '2026-05-13 14:20:48,John Doe,john@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,owner@groweasy.ai,GOOD_LEAD_FOLLOW_UP,Asked for a callback,leads_on_demand,,',
].join('\n');

export default function DropZone({ onFile, file, loading }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const droppedFile = event.dataTransfer.files.item(0);
      if (droppedFile) {
        onFile(droppedFile);
      }
    },
    [onFile]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0);
    if (selectedFile) {
      onFile(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'groweasy_leads_template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`ge-dropzone${dragging ? ' is-dragging' : ''}${loading ? ' is-loading' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={handleChange}
        disabled={loading}
      />

      <label className="ge-dropzone-target" htmlFor={inputId}>
        <span className="ge-dropzone-icon">
          {file ? <FiFileText aria-hidden="true" /> : <FiUpload aria-hidden="true" />}
        </span>
        <strong>{file ? file.name : 'Drop your CSV file here'}</strong>
        <small>{file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'or click to browse files'}</small>
      </label>

      <div className="ge-support-chip">
        <FiInfo aria-hidden="true" />
        Supported file: .csv (max 5MB)
      </div>

      <p className="ge-dropzone-help">
        Required headers: created_at, name, email, country_code, mobile_without_country_code,
        company, city, state, country, lead_owner, crm_status, crm_note.
        Template includes default + custom CRM fields to reduce upload errors.
      </p>

      <button className="ge-template-button" type="button" onClick={downloadTemplate}>
        <FiDownload aria-hidden="true" />
        Download Sample CSV Template
      </button>
    </div>
  );
}
