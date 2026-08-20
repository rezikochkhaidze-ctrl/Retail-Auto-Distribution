import React, { useState } from 'react';
import { Branch, SKURule } from '../types';
import { Plus, Trash2, PackageSearch, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  branches: Branch[];
  skuRules: SKURule[];
  setSkuRules: (rules: SKURule[]) => void;
}

export function SKURuleManager({ branches, skuRules, setSkuRules }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [targets, setTargets] = useState<Record<string, number>>({});

  const startNewRule = () => {
    setEditingId('new');
    setSku('');
    setDescription('');
    
    // Initialize targets with 0 for all existing branches
    const initialTargets: Record<string, number> = {};
    branches.forEach(b => initialTargets[b.id] = 0);
    setTargets(initialTargets);
  };

  const startEdit = (rule: SKURule) => {
    setEditingId(rule.id);
    setSku(rule.sku);
    setDescription(rule.description);
    
    // Merge existing targets with any new branches that were added later
    const mergedTargets = { ...rule.targets };
    branches.forEach(b => {
      if (mergedTargets[b.id] === undefined) {
        mergedTargets[b.id] = 0;
      }
    });
    setTargets(mergedTargets);
  };

  const handleTargetChange = (branchId: string, value: string) => {
    setTargets(prev => ({
      ...prev,
      [branchId]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const handleSave = () => {
    if (!sku.trim()) return;

    if (editingId === 'new') {
      const newRule: SKURule = {
        id: Date.now().toString(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        targets: { ...targets }
      };
      setSkuRules([newRule, ...skuRules]);
    } else {
      setSkuRules(skuRules.map(r => 
        r.id === editingId ? { ...r, sku: sku.trim().toUpperCase(), description: description.trim(), targets: { ...targets } } : r
      ));
    }
    
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSkuRules(skuRules.filter(r => r.id !== id));
  };

  if (branches.length === 0) {
    return (
      <div className="bg-[#1a1d23] p-8 rounded border border-slate-800 text-center max-w-4xl mx-auto mt-10">
        <PackageSearch className="mx-auto h-10 w-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-medium text-slate-300 mb-2">No Branches Configured</h3>
        <p className="text-xs text-slate-500">Please add at least one branch location before configuring SKU rules.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto">
      <div className="bg-[#1a1d23] border border-slate-800 p-6 rounded shrink-0 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Rule Editor</p>
          <h2 className="text-lg font-semibold text-slate-100">SKU Target Rules</h2>
          <p className="text-xs text-slate-400">Define ideal inventory levels for each product per store.</p>
        </div>
        {!editingId && (
          <button
            onClick={startNewRule}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add SKU Rule
          </button>
        )}
      </div>

      {editingId && (
        <div className="bg-[#15181e] border border-blue-900/50 rounded p-5 shrink-0">
          <h3 className="font-bold text-slate-300 mb-4 text-sm">
            {editingId === 'new' ? 'Create New SKU Rule' : 'Edit SKU Rule'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. LAPTOP-15-PRO"
                className="w-full px-3 py-1.5 bg-[#0f1115] text-blue-400 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 15-inch Pro Laptop"
                className="w-full px-3 py-1.5 bg-[#0f1115] text-slate-100 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 border-b border-slate-800 pb-2">Target Quantities per Branch</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {branches.map(branch => (
              <div key={branch.id} className="bg-[#1a1d23] p-2.5 rounded border border-slate-700">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 truncate" title={branch.name}>
                  {branch.name}
                </label>
                <input
                  type="number"
                  min="0"
                  value={targets[branch.id] || 0}
                  onChange={(e) => handleTargetChange(branch.id, e.target.value)}
                  className="w-full px-2 py-1 bg-[#0f1115] text-slate-100 border border-slate-700 rounded outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingId(null)}
              className="px-4 py-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 font-medium rounded transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!sku.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center gap-2 text-xs"
            >
              <Save size={14} />
              Save Rule
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-[#1a1d23] border border-slate-800 rounded overflow-hidden">
        <div className="bg-[#252a33] px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">Active Rules</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {skuRules.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No rules defined yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#252a33] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-2">SKU ID</th>
                  <th className="px-4 py-2">Product Description</th>
                  <th className="px-4 py-2 text-center">Total Target</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {skuRules.map(rule => {
                  const totalTarget = Object.values(rule.targets).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3 font-mono text-blue-400">{rule.sku}</td>
                      <td className="px-4 py-3 text-slate-300 font-sans truncate max-w-[250px]">{rule.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-emerald-400 font-bold">{totalTarget}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(rule)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 rounded transition-colors text-[10px] uppercase font-bold tracking-wider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded ml-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
