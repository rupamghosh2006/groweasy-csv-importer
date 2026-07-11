'use client';

import { useCallback, useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';

interface DropZoneProps {
  onFile: (file: File) => void;
  file: File | null;
  loading: boolean;
}

export default function DropZone({ onFile, file, loading }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith('.csv')) {
        onFile(f);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
        dragging
          ? 'border-[#294744] bg-[#294744]/5'
          : 'border-gray-300 dark:border-gray-600 hover:border-[#294744]/50'
      } ${loading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />

      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#294744]/10 flex items-center justify-center">
            <FiFile className="w-6 h-6 text-[#294744]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFile(null as unknown as File);
            }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <FiX className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FiUploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              Drop your CSV here, or <span className="text-[#294744] underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Only .csv files accepted</p>
          </div>
        </div>
      )}
    </div>
  );
}
