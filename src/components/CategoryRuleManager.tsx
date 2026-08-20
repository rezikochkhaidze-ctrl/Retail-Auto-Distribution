import React, { useRef, useState } from 'react';
import { Branch, CategoryRule } from '../types';
import { Plus, Trash2, Layers, Save, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseCategoryRulesExcel } from '../lib/excel';

interface Props {
  branches: Branch[];
  categoryRules: CategoryRule[];
  setCategoryRules: (rules: CategoryRule[]) => void;
}

export function CategoryRuleManager({ branches, categoryRules, setCategoryRules }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [targets, setTargets] = useState<Record<string, number>>({});

  const startNewRule = () => {
    setEditingId('new');
    setCategory('');
    setDescription('');
    
    // Initialize targets with 0 for all existing branches
    const initialTargets: Record<string, number> = {};
    branches.forEach(b => initialTargets[b.id] = 0);
    setTargets(initialTargets);
  };

  const startEdit = (rule: CategoryRule) => {
    setEditingId(rule.id);
    setCategory(rule.category);
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
    if (!category.trim()) return;

    if (editingId === 'new') {
      const newRule: CategoryRule = {
        id: Date.now().toString(),
        category: category.trim().toUpperCase(),
        description: description.trim(),
        targets: { ...targets }
      };
      setCategoryRules([newRule, ...categoryRules]);
    } else {
      setCategoryRules(categoryRules.map(r => 
        r.id === editingId ? { ...r, category: category.trim().toUpperCase(), description: description.trim(), targets: { ...targets } } : r
      ));
    }
    
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setCategoryRules(categoryRules.filter(r => r.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newRules = await parseCategoryRulesExcel(file, branches);
      // Merge with existing, overwrite on matching Category
      const existingMap = new Map(categoryRules.map(r => [r.category, r]));
      newRules.forEach(nr => {
        existingMap.set(nr.category, nr);
      });
      setCategoryRules(Array.from(existingMap.values()));
    } catch (err) {
      console.error(err);
      alert("Failed to parse Category Rules. Please check the Excel format.");
    }
    if (e.target) e.target.value = '';
  };

  if (branches.length === 0) {
    return (
      <div className="bg-[#1a1d23] p-8 rounded border border-slate-800 text-center max-w-4xl mx-auto mt-10">
        <Layers className="mx-auto h-10 w-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-medium text-slate-300 mb-2">No Branches Configured</h3>
        <p className="text-xs text-slate-500">Please add at least one branch location before configuring category rules.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto">
      <div className="bg-[#1a1d23] border border-slate-800 p-6 rounded shrink-0 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Rule Editor</p>
          <h2 className="text-lg font-semibold text-slate-100">Category Target Rules</h2>
          <p className="text-xs text-slate-400">Define fallback inventory targets for entire product categories (e.g. Refrigerators).</p>
        </div>
        {!editingId && (
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 bg-[#252a33] hover:bg-[#2d333f] border border-slate-700 text-slate-300 font-medium rounded transition-colors flex items-center gap-2 text-sm"
            >
              <Upload size={16} />
              Upload Rules
            </button>
            <button
              onClick={startNewRule}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Category Rule
            </button>
          </div>
        )}
      </div>

      {editingId && (
        <div className="bg-[#15181e] border border-blue-900/50 rounded p-5 shrink-0">
          <h3 className="font-bold text-slate-300 mb-4 text-sm">
            {editingId === 'new' ? 'Create New Category Rule' : 'Edit Category Rule'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Category Name</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. REFRIGERATORS"
                className="w-full px-3 py-1.5 bg-[#0f1115] text-blue-400 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard cooling appliances"
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
              disabled={!category.trim()}
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
          <h2 className="text-sm font-semibold text-slate-100">Active Category Rules</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {categoryRules.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No rules defined yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#252a33] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-center">Total Target</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {categoryRules.map(rule => {
                  const totalTarget = Object.values(rule.targets).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3 font-mono text-blue-400">{rule.category}</td>
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
