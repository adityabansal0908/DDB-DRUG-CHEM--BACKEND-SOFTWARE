import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseExcelFile, downloadExcelTemplate, ParsedProductRow } from '../../utils/excelHelper';
import {
  FileXls,
  UploadSimple,
  X,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  ArrowsClockwise,
  ListBullets,
  Tag,
  Plus
} from '@phosphor-icons/react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { addMultipleProducts } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedProductRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);

    try {
      const result = await parseExcelFile(selectedFile);
      setParsedData(result.products);
      setErrors(result.errors);
    } catch (err: any) {
      setErrors([err?.message || 'Failed to read file. Please ensure it is a valid Excel (.xlsx, .xls) or CSV file.']);
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCommit = () => {
    if (parsedData.length === 0) return;

    const productsToSave = parsedData.map((p) => ({
      name: p.name,
      genericName: p.genericName,
      packaging: p.packaging || 'Standard Packaging',
      form: p.form || 'Tablet',
      mrp: Number(p.mrp) || 0,
      pricingToStockist: Number(p.pricingToStockist) || (p.sellingRate ? Math.round(p.sellingRate * 0.88 * 100) / 100 : 0),
      pricingToRetailer: Number(p.pricingToRetailer) || (p.sellingRate ? Math.round(p.sellingRate * 0.94 * 100) / 100 : 0),
      sellingRate: Number(p.sellingRate) || 0,
      purchasePrice: Number(p.purchasePrice) || 0,
      gst: p.gst || '12%',
      company: p.company || 'DDB DRUG CHEM',
      stockUnits: Number(p.stockUnits) || 0,
      batchNo: p.batchNo || 'BATCH-01',
      expiryDate: p.expiryDate || '12/2028',
      batches: p.batches || [{ batchNumber: p.batchNo, expiryDate: p.expiryDate, stock: p.stockUnits }],
      category: p.category as any,
      minOrderQty: 10,
      status: (Number(p.stockUnits) === 0 ? 'out_of_stock' : Number(p.stockUnits) < 500 ? 'low_stock' : 'active') as any,
      indication: 'Standard clinical formulary entry'
    }));

    addMultipleProducts(productsToSave, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="excel-import-modal-backdrop"
      data-testid="excel-import-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <FileXls size={24} weight="fill" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">
                Import Products via Excel / Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk upload pharmaceutical catalog matching the 10-column formulary specification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              title="Download pre-formatted .xlsx template"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Expected Format Guide Callout */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <ListBullets size={16} className="text-blue-600" />
              Required 10 Columns in your Excel / CSV:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 text-[11px] font-mono">
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 1</span>
              <strong className="text-slate-900">Product Name</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 2</span>
              <strong className="text-slate-900">Salt Name/Comp</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 3</span>
              <strong className="text-slate-900">Packaging</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 4</span>
              <strong className="text-slate-900">Dosage form</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 5</span>
              <strong className="text-slate-900">MRP</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 6</span>
              <strong className="text-slate-900">Selling Price</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 7</span>
              <strong className="text-slate-900">Purchase Price</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 8</span>
              <strong className="text-slate-900">GST</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">COL 9</span>
              <strong className="text-slate-900">Company</strong>
            </div>
            <div className="bg-white p-1.5 rounded border border-blue-200 bg-blue-50/50">
              <span className="text-blue-500 block text-[9px] font-sans font-bold">COL 10</span>
              <strong className="text-blue-900">Category</strong>
            </div>
          </div>
        </div>

        {/* Upload Drop Zone */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <UploadSimple size={26} weight="bold" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Click to select or drag and drop your Excel spreadsheet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv files formatted with the 10 columns
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                <FileXls size={14} className="text-emerald-600" />
                Microsoft Excel (.xlsx)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                Comma Separated (.csv)
              </span>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isParsing && (
          <div className="p-8 text-center space-y-3">
            <ArrowsClockwise size={32} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Parsing spreadsheet rows...</p>
          </div>
        )}

        {/* Errors list */}
        {errors.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-800">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <WarningCircle size={16} weight="fill" />
              <span>Notice during parsing:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
            </ul>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">
                  {parsedData.length} Formulations detected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Import Mode:</span>
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 text-xs">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      importMode === 'append' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Append to Existing
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      importMode === 'replace' ? 'bg-red-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Replace All
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Choose another file"
                >
                  <ArrowsClockwise size={16} />
                </button>
              </div>
            </div>

            {/* Preview table matching 10 columns */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase tracking-wider text-[10px]">
                    <tr className="border-b border-slate-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">1. Product Name</th>
                      <th className="py-2.5 px-3">2. Salt / Comp</th>
                      <th className="py-2.5 px-3">3. Packaging</th>
                      <th className="py-2.5 px-3">4. Dosage</th>
                      <th className="py-2.5 px-3 text-right">5. MRP</th>
                      <th className="py-2.5 px-3 text-right text-indigo-700 bg-indigo-50/40 whitespace-nowrap">6. PTS (Stockist)</th>
                      <th className="py-2.5 px-3 text-right text-indigo-700 bg-indigo-50/40 whitespace-nowrap">7. PTR (Retailer)</th>
                      <th className="py-2.5 px-3 text-right">8. Selling</th>
                      <th className="py-2.5 px-3 text-right">9. Purchase</th>
                      <th className="py-2.5 px-3 text-center">10. GST</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">11. Company</th>
                      <th className="py-2.5 px-3 whitespace-nowrap text-blue-800 bg-blue-50/50">12. Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{row.name}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={row.genericName}>
                          {row.genericName}
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{row.packaging}</td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{row.form}</td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums text-slate-800">
                          ₹{row.mrp.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums text-indigo-700 bg-indigo-50/30">
                          ₹{(row.pricingToStockist || (row.sellingRate ? Math.round(row.sellingRate * 0.88 * 100) / 100 : 0)).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums text-indigo-700 bg-indigo-50/30">
                          ₹{(row.pricingToRetailer || (row.sellingRate ? Math.round(row.sellingRate * 0.94 * 100) / 100 : 0)).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-blue-700">
                          ₹{row.sellingRate.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500 tabular-nums">
                          ₹{row.purchasePrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-slate-700">{row.gst}</td>
                        <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {row.company || 'DDB DRUG CHEM'}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {row.category || 'General'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                File: <strong className="text-slate-700">{file?.name}</strong> ({(Number(file?.size) / 1024).toFixed(1)} KB)
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Import {parsedData.length} Formulations to Catalog</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
