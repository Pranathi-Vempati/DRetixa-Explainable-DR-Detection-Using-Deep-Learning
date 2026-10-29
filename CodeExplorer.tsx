import React, { useState } from 'react';
import { PYTHON_FILES } from '../data/pythonFiles';
import { PythonProjectFile } from '../types';
import { 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  FolderTree, 
  Download, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonProjectFile>(PYTHON_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Windows PowerShell Quick Start Guide Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Windows PowerShell Setup & Execution Guide (VS Code)
        </h3>
        <p className="text-xs text-slate-300 mb-3">
          Follow these sequential steps in your Windows terminal to run the native PyTorch + Streamlit DRetixa system locally:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-sans font-semibold">1. Create & Activate Virtual Environment</div>
            <div className="text-emerald-400 selection:bg-emerald-800">python -m venv .venv</div>
            <div className="text-emerald-400 selection:bg-emerald-800">.\.venv\Scripts\Activate.ps1</div>
            <div className="text-slate-500 text-[11px] font-sans">
              *If execution is blocked: <code className="text-slate-300">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-sans font-semibold">2. Install Dependencies & Launch</div>
            <div className="text-emerald-400 selection:bg-emerald-800">pip install --upgrade pip</div>
            <div className="text-emerald-400 selection:bg-emerald-800">pip install -r requirements.txt</div>
            <div className="text-emerald-400 selection:bg-emerald-800">streamlit run app.py</div>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Tree (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg h-fit">
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-3 pb-2 border-b border-slate-800">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <span>DRetixa Modular Project Files ({PYTHON_FILES.length})</span>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {PYTHON_FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{file.path}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 ml-2">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                {selectedFile.path}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="relative bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[560px] border border-slate-800/80 leading-relaxed">
            <pre>
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
