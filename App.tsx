/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FundusAnalyzer } from './components/FundusAnalyzer';
import { ModelEvaluation } from './components/ModelEvaluation';
import { CodeExplorer } from './components/CodeExplorer';
import { Phase1Report } from './components/Phase1Report';
import { 
  Eye, 
  Activity, 
  FileCode, 
  BarChart3, 
  BookOpen, 
  ShieldAlert, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'phase1' | 'evaluation' | 'code'>('analyzer');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-white/20">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">DRetixa</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  DenseNet-121 + Grad-CAM
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 hidden sm:inline-block">
                  ICDR 5-Grade Scale
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Explainable Diabetic Retinopathy Detection Using Deep Learning</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'analyzer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Diagnostic Console</span>
            </button>

            <button
              onClick={() => setActiveTab('phase1')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'phase1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Phase 1 Report & Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'evaluation'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Model Evaluation (QWK: 0.914)</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'code'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Python Project Explorer</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'analyzer' && <FundusAnalyzer />}
        {activeTab === 'phase1' && <Phase1Report />}
        {activeTab === 'evaluation' && <ModelEvaluation />}
        {activeTab === 'code' && <CodeExplorer />}
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">DRetixa Academic System</span>
            <span>•</span>
            <span>Final-Year B.Tech Computer Science & Engineering</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            PyTorch 2.x • DenseNet-121 • Grad-CAM • OpenCV CLAHE • Streamlit
          </div>
        </div>
      </footer>
    </div>
  );
}
