import React, { useState } from 'react';
import { Branch } from '../types';
import { Plus, Trash2, Store } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
}

export function BranchManager({ branches, setBranches }: Props) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState<number | string>(1);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const parsedWeight = Math.max(1, Math.min(10, Number(weight) || 1));
    
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: name.trim(),
      weight: parsedWeight
    };
    
    setBranches([...branches, newBranch]);
    setName('');
    setWeight(1);
  };

  const handleDelete = (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl mx-auto">
      <div className="bg-[#1a1d23] border border-slate-800 p-6 rounded shrink-0">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Store Management</p>
          <h2 className="text-lg font-semibold text-slate-100">Branch Locations</h2>
          <p className="text-xs text-slate-400">Manage stores and their priority rankings (1-10).</p>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end mb-6">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Store Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Metro"
              className="w-full px-3 py-1.5 bg-[#0f1115] text-slate-100 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight</label>
            <input
              type="number"
              min="1"
              max="10"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0f1115] text-slate-100 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 h-[34px]"
          >
            <Plus size={16} />
            Add Branch
          </button>
        </form>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d23] border border-slate-800 rounded overflow-hidden">
        <div className="bg-[#252a33] px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">Registered Branches</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {branches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No branches added yet. Add your first store above.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#252a33] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-2">Store Name</th>
                  <th className="px-4 py-2 w-32 text-center">Priority Weight</th>
                  <th className="px-4 py-2 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {branches.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-300">{branch.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono text-[10px] border",
                        branch.weight >= 8 ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" :
                        branch.weight >= 4 ? "bg-yellow-950 text-yellow-400 border-yellow-900/50" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      )}>
                        {branch.weight} / 10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/50 rounded transition-colors"
                        title="Delete branch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
