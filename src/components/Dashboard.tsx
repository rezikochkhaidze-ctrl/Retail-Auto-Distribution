import React, { useMemo } from 'react';
import { AllocationResult, Branch } from '../types';
import { exportAllocationExcel } from '../lib/excel';
import { AlertTriangle, Download, Info, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  results: AllocationResult[];
  branches: Branch[];
}

export function Dashboard({ results, branches }: Props) {
  const stats = useMemo(() => {
    const totalSKUs = results.length;
    let oosCount = 0;
    let shortageCount = 0;
    let fulfilledCount = 0;
    let totalTarget = 0;
    let totalAllocated = 0;

    results.forEach(r => {
      if (r.isOOS) oosCount++;
      else if (r.fillRate < 1) shortageCount++;
      else fulfilledCount++;
      
      totalTarget += r.totalTarget;
      totalAllocated += r.totalAllocated;
    });
    
    const globalFillRate = totalTarget > 0 ? (totalAllocated / totalTarget) * 100 : 0;

    return { totalSKUs, oosCount, shortageCount, fulfilledCount, globalFillRate };
  }, [results]);

  const handleExport = () => {
    exportAllocationExcel(results, branches);
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <BarChart3 size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-medium text-slate-300 mb-2">No Results Yet</h2>
        <p className="text-sm">Run the distribution algorithm from the Central Stock tab first.</p>
      </div>
    );
  }

  const oosList = results.filter(r => r.isOOS);
  const criticalList = results.filter(r => !r.isOOS && r.fillRate < 0.5 && r.totalTarget > 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-slate-100">Distribution Results</h2>
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2"
        >
          <Download size={16} />
          Export Plan (.csv)
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#1a1d23] border border-slate-800 p-3 rounded">
          <p className="text-xs text-slate-500 mb-1">Total SKUs Analyzed</p>
          <p className="text-2xl font-mono font-bold text-slate-100 tracking-tighter">{stats.totalSKUs}</p>
        </div>
        <div className="bg-[#1a1d23] border border-slate-800 p-3 rounded">
          <p className="text-xs text-slate-500 mb-1">Global Fill Rate</p>
          <p className="text-2xl font-mono font-bold text-emerald-500 tracking-tighter">{stats.globalFillRate.toFixed(1)}%</p>
        </div>
        <div className="bg-[#1a1d23] border border-slate-800 p-3 rounded">
          <p className="text-xs text-slate-500 mb-1">Partial Shortage</p>
          <p className="text-2xl font-mono font-bold text-yellow-500 tracking-tighter">{stats.shortageCount}</p>
        </div>
        <div className="bg-[#1a1d23] border border-slate-800 p-3 rounded">
          <p className="text-xs text-slate-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-mono font-bold text-red-500 tracking-tighter">{stats.oosCount}</p>
        </div>
      </div>

      {/* Alerts Section */}
      {(oosList.length > 0 || criticalList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          {oosList.length > 0 && (
            <div className="bg-[#1a1d23] rounded border border-red-900/50 overflow-hidden flex flex-col max-h-48">
              <div className="bg-red-950/20 border-b border-red-900/30 px-3 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <h3 className="text-xs font-bold text-red-400">Critical: Out of Stock ({oosList.length})</h3>
              </div>
              <div className="overflow-y-auto">
                <ul className="divide-y divide-slate-800/50">
                  {oosList.map(r => (
                    <li key={r.sku} className="px-3 py-2 flex justify-between items-center hover:bg-slate-800/40">
                      <div>
                        <p className="font-mono text-blue-400 text-xs">{r.sku}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{r.description}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-red-950 text-red-400 px-2 py-0.5 rounded-full border border-red-900/50">
                        Needed: {r.totalTarget}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {criticalList.length > 0 && (
            <div className="bg-[#1a1d23] rounded border border-yellow-900/50 overflow-hidden flex flex-col max-h-48">
              <div className="bg-yellow-950/20 border-b border-yellow-900/30 px-3 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <h3 className="text-xs font-bold text-yellow-400">Warning: Fill Rate &lt; 50% ({criticalList.length})</h3>
              </div>
              <div className="overflow-y-auto">
                <ul className="divide-y divide-slate-800/50">
                  {criticalList.map(r => (
                    <li key={r.sku} className="px-3 py-2 flex justify-between items-center hover:bg-slate-800/40">
                      <div>
                        <p className="font-mono text-blue-400 text-xs">{r.sku}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{r.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-yellow-400">{(r.fillRate * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-500 font-mono">{r.totalAllocated}/{r.totalTarget}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Data Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d23] border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-[#252a33] px-4 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">Complete Allocation Matrix</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#252a33] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 shadow-sm z-20">
              <tr>
                <th className="px-4 py-2 sticky left-0 bg-[#252a33] z-30 shadow-[1px_0_0_#1e293b]">SKU / Status</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right border-r border-slate-800">Total Alloc</th>
                {branches.map(b => (
                  <th key={b.id} className="px-4 py-2 text-center">
                    {b.name} <span className="text-blue-500 ml-1">W:{b.weight}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/50 font-mono">
              {results.map((r) => (
                <tr key={r.sku} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 sticky left-0 bg-[#1a1d23] group-hover:bg-[#20242b] z-10 shadow-[1px_0_0_#1e293b]">
                    <div className="font-mono text-blue-400">{r.sku}</div>
                    <div className="mt-1">
                      {r.isOOS ? (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-900/50 rounded-full text-[10px] uppercase">OOS</span>
                      ) : r.fillRate < 1 ? (
                        <span className="px-2 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-900/50 rounded-full text-[10px] uppercase">
                          {(r.fillRate * 100).toFixed(0)}% FILL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-full text-[10px] uppercase">OPTIMAL</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{r.centralStock}</td>
                  <td className="px-4 py-3 text-right text-slate-100 border-r border-slate-800 font-bold">
                    {r.totalAllocated} <span className="text-slate-600 font-normal text-[10px]">/ {r.totalTarget}</span>
                  </td>
                  
                  {branches.map(b => {
                    const detail = r.details.find(d => d.branchId === b.id);
                    const target = detail?.target || 0;
                    const allocated = detail?.allocated || 0;
                    const currentStock = detail?.currentStock || 0;
                    const totalAfterAllocation = currentStock + allocated;
                    const isShort = totalAfterAllocation < target;

                    return (
                      <td key={b.id} className={cn(
                        "px-4 py-3 text-center",
                        isShort && totalAfterAllocation > 0 ? "bg-yellow-950/10" : "",
                        isShort && totalAfterAllocation === 0 && target > 0 ? "bg-red-950/10" : ""
                      )}>
                        {target > 0 ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-500" title="Current Stock">{currentStock}</span>
                              <span className="text-slate-600 text-[10px]">+</span>
                              <span className={cn("font-bold text-sm", isShort ? (totalAfterAllocation === 0 ? "text-red-500" : "text-yellow-500") : "text-emerald-500")} title="Allocated">
                                {allocated}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600 mt-0.5" title="Target">/ {target}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
