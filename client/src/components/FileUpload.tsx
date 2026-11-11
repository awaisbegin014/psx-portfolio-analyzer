import { useState, type DragEvent, type FormEvent } from 'react';

import { formatFileSize } from '../utils/formatters';

interface FileUploadProps {
  file: File | null;
  isSubmitting: boolean;
  onFileChange: (file: File) => void;
  onSubmit: () => void;
}

export function FileUpload({ file, isSubmitting, onFileChange, onSubmit }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div
        className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4" />
          </svg>
        </div>

        {file ? (
          <div className="selected-file">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)} · CSV document</span>
          </div>
        ) : (
          <div className="drop-zone-copy">
            <strong>Drop your trades CSV here</strong>
            <span>or choose it from your computer</span>
          </div>
        )}

        <label className="file-button" htmlFor="trades-file">
          {file ? 'Replace file' : 'Choose file'}
        </label>
        <input
          id="trades-file"
          className="visually-hidden"
          type="file"
          accept=".csv,text/csv"
          disabled={isSubmitting}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) {
              onFileChange(selectedFile);
            }
            event.target.value = '';
          }}
        />
      </div>

      <div className="upload-actions">
        <p>Maximum file size: 1 MB</p>
        <button className="primary-button" type="submit" disabled={!file || isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Analysing portfolio
            </>
          ) : (
            'Analyse portfolio'
          )}
        </button>
      </div>
    </form>
  );
}
