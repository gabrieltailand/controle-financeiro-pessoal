import React, { useState } from 'react';
import { ExternalLink, FileSpreadsheet, PlusCircle, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { SpreadsheetDetails } from '../services/sheetsService';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheet: SpreadsheetDetails | null;
  onSelectSpreadsheet: (id: string) => Promise<void>;
  onCreateNewSpreadsheet: (name?: string) => Promise<void>;
  availableFiles: Array<{ id: string; name: string; webViewLink?: string }>;
  isRefreshingFiles: boolean;
  onRefreshFiles: () => Promise<void>;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({
  isOpen,
  onClose,
  spreadsheet,
  onSelectSpreadsheet,
  onCreateNewSpreadsheet,
  availableFiles,
  isRefreshingFiles,
  onRefreshFiles,
}) => {
  const [manualId, setManualId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (id: string) => {
    try {
      setError(null);
      setLoadingAction(`select-${id}`);
      await onSelectSpreadsheet(id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar planilha');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      setLoadingAction('create');
      await onCreateNewSpreadsheet(newTitle.trim() || undefined);
      setNewTitle('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar planilha');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    let cleanId = manualId.trim();
    // Support pasting full Google Sheets URL
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    try {
      setError(null);
      setLoadingAction('manual');
      await onSelectSpreadsheet(cleanId);
      setManualId('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Planilha não encontrada ou sem permissão');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Planilha do Google Drive</h2>
              <p className="text-xs text-slate-400">Gerencie onde seus gastos são gravados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 overflow-y-auto space-y-6 pr-1 flex-1">
          {/* Current Connected Spreadsheet */}
          {spreadsheet && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Planilha Conectada
                </span>
                <a
                  href={spreadsheet.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline"
                >
                  Abrir no Google Sheets
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <h4 className="mt-1.5 font-bold text-white text-base truncate">{spreadsheet.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Aba: <span className="text-slate-300 font-mono font-medium">{spreadsheet.sheetTitle}</span> • ID: <span className="font-mono text-slate-400">{spreadsheet.id}</span>
              </p>
            </div>
          )}

          {/* Create New Spreadsheet */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Criar Nova Planilha no Drive
            </h3>
            <p className="text-xs text-slate-400">
              Cria uma nova planilha estruturada com cabeçalhos e formatações de moeda brasileiras.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da planilha (opcional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={loadingAction === 'create'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {loadingAction === 'create' ? 'Criando...' : 'Criar Nova'}
              </button>
            </div>
          </div>

          {/* Available Drive Spreadsheets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Planilhas encontradas no seu Drive</h3>
              <button
                type="button"
                onClick={onRefreshFiles}
                disabled={isRefreshingFiles}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFiles ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            {availableFiles.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhuma outra planilha de finanças encontrada recentemente.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableFiles.map((f) => {
                  const isCurrent = spreadsheet?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm transition ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold truncate text-slate-100">{f.name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{f.id}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent ? (
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Atual
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelect(f.id)}
                            disabled={loadingAction === `select-${f.id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 text-white text-xs font-medium transition"
                          >
                            {loadingAction === `select-${f.id}` ? 'Conectando...' : 'Usar Esta'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Or Paste Sheet ID / Link */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Ou cole o link ou ID de uma planilha existente:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... ou ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loadingAction === 'manual' || !manualId.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition disabled:opacity-50"
              >
                {loadingAction === 'manual' ? 'Conectando...' : 'Vincular'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
