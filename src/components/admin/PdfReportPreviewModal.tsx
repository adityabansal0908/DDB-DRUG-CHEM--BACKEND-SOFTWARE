import React from 'react';
import { X, DownloadSimple, Printer, FileText } from '@phosphor-icons/react';

interface PdfReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlobUrl: string | null;
  fileName: string;
  onDownload: () => void;
}

export const PdfReportPreviewModal: React.FC<PdfReportPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfBlobUrl,
  fileName,
  onDownload
}) => {
  if (!isOpen || !pdfBlobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <FileText size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md">
                Formatted Sales Report Preview: {fileName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Official DDB DRUG CHEM audit document with letterhead & KPI tables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
          <iframe
            src={pdfBlobUrl}
            title="Sales Report PDF Preview"
            className="w-full h-full rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
