import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Branch, SKURule, CategoryRule, StockItem, AllocationResult } from './types';
import { allocateStock } from './lib/allocation';

import { BranchManager } from './components/BranchManager';
import { SKURuleManager } from './components/SKURuleManager';
import { CategoryRuleManager } from './components/CategoryRuleManager';
import { StockIngestion } from './components/StockIngestion';
import { Dashboard } from './components/Dashboard';

import { LayoutDashboard, Store, PackageSearch, Layers, Database, Zap } from 'lucide-react';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'ingestion' | 'branches' | 'category-rules' | 'rules';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ingestion');
  
  // Persistent State
  const [branches, setBranches] = useLocalStorage<Branch[]>('sc_branches', []);
  const [categoryRules, setCategoryRules] = useLocalStorage<CategoryRule[]>('sc_category_rules', []);
  const [skuRules, setSkuRules] = useLocalStorage<SKURule[]>('sc_rules', []);
  
  // Session State
  const [results, setResults] = useState<AllocationResult[]>([]);

  const handleRunDistribution = (stockItems: StockItem[]) => {
    const calculatedResults = allocateStock(stockItems, branches, skuRules, categoryRules);
    setResults(calculatedResults);
    setActiveTab('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingestion', label: 'Central Stock', icon: Database },
    { id: 'branches', label: 'Branches', icon: Store },
    { id: 'category-rules', label: 'Category Rules', icon: Layers },
    { id: 'rules', label: 'SKU Rules', icon: PackageSearch },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f1115] text-slate-300 font-sans overflow-hidden">
      {/* Top Nav */}
      <nav className="h-14 bg-[#1a1d23] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white tracking-tighter">
            <Zap size={18} />
          </div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">Retail Auto-Distributor</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#252a33] px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Engine: Active
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-56 bg-[#15181e] border-r border-slate-800 flex flex-col p-4 gap-6 shrink-0 overflow-y-auto hidden md:flex">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Main Navigation</p>
            <ul className="space-y-1 text-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "px-3 py-2 rounded flex items-center gap-3 cursor-pointer font-medium transition-colors",
                      isActive 
                        ? "bg-blue-600/10 text-blue-400" 
                        : "hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Mobile Nav (Visible only on small screens) */}
        <div className="md:hidden bg-[#15181e] flex overflow-x-auto p-2 gap-1 border-b border-slate-800 shrink-0 absolute top-14 left-0 right-0 z-40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-3 py-2 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 mt-14 md:mt-0">
            {activeTab === 'dashboard' && (
              <Dashboard results={results} branches={branches} />
            )}
            
            {activeTab === 'ingestion' && (
              <StockIngestion 
                onRunDistribution={handleRunDistribution} 
                hasRules={skuRules.length > 0 || categoryRules.length > 0}
                hasBranches={branches.length > 0}
                branches={branches}
              />
            )}
            
            {activeTab === 'branches' && (
              <BranchManager branches={branches} setBranches={setBranches} />
            )}

            {activeTab === 'category-rules' && (
              <CategoryRuleManager branches={branches} categoryRules={categoryRules} setCategoryRules={setCategoryRules} />
            )}
            
            {activeTab === 'rules' && (
              <SKURuleManager branches={branches} skuRules={skuRules} setSkuRules={setSkuRules} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
