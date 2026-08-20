import React, { useState, useRef } from 'react';
import { Upload, Play, FileSpreadsheet, XCircle } from 'lucide-react';
import { parseStockExcel } from '../lib/excel';
import { StockItem } from '../types';

interface Props {
  onRunDistribution: (items: StockItem[]) => void;
  hasRules: boolean;
  hasBranches: boolean;
  branches: import('../types').Branch[];
}

export function StockIngestion({ onRunDistribution, hasRules, hasBranches, branches }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setFileName(file.name);
      const items = await parseStockExcel(file, branches);
      if (items.length === 0) {
        setError('No valid stock items found. Ensure columns exist for SKU and Available Quantity.');
      } else {
        setStockItems(items);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse the file. Please check the format.');
      setFileName(null);
      setStockItems([]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setStockItems([]);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isReadyToRun = stockItems.length > 0 && hasRules && hasBranches;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="bg-[#1a1d23] p-6 rounded border border-slate-800 shrink-0">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Data Ingestion</p>
          <h2 className="text-lg font-semibold text-slate-100">Central Stock Data</h2>
          <p className="text-xs text-slate-400">Upload your current warehouse stock Excel file to begin distribution.</p>
        </div>

        {!fileName ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border border-dashed rounded p-8 text-center transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-900/10' 
                : 'border-slate-700 bg-[#15181e] hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="mx-auto h-8 w-8 text-slate-500 mb-3" />
            <p className="text-sm text-slate-300 mb-1">Drag and drop your Excel file here</p>
            <p className="text-xs text-slate-500 mb-4">Required columns: SKU, Available Quantity. Optional: Branch Names (for current stock)</p>
            
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded hover:bg-slate-700 transition-colors"
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-900/40 text-emerald-500 rounded">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-emerald-400">{fileName}</h3>
                  <p className="text-xs text-emerald-600/80">{stockItems.length} valid SKUs detected</p>
                </div>
              </div>
              <button 
                onClick={handleClear}
                className="p-1.5 text-emerald-600 hover:bg-emerald-900/40 rounded transition-colors"
                title="Clear file"
              >
                <XCircle size={16} />
              </button>
            </div>
            
            <div className="mt-6 flex flex-col items-center border-t border-emerald-900/30 pt-4">
              {!hasBranches ? (
                <p className="text-yellow-500 text-xs mb-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  You need to add Branches before running distribution.
                </p>
              ) : !hasRules ? (
                <p className="text-yellow-500 text-xs mb-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  You need to configure SKU Rules before running distribution.
                </p>
              ) : null}
              
              <button
                onClick={() => onRunDistribution(stockItems)}
                disabled={!isReadyToRun}
                className={`px-6 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all ${
                  isReadyToRun 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play size={16} className={isReadyToRun ? "fill-white text-white" : ""} />
                Execute Distribution Engine
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-950/20 text-red-400 rounded border border-red-900/50 text-xs">
            {error}
          </div>
        )}
      </div>

      {stockItems.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d23] border border-slate-800 rounded overflow-hidden">
          <div className="bg-[#252a33] px-4 py-3 border-b border-slate-800 shrink-0">
            <h3 className="text-sm font-semibold text-slate-100">Preview Data (First 10 rows)</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#252a33] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-2">SKU ID</th>
                  <th className="px-4 py-2">Product Description</th>
                  <th className="px-4 py-2 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50 font-mono">
                {stockItems.slice(0, 10).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-blue-400">{item.sku}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-sans truncate max-w-[200px]">{item.description}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-100">{item.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
