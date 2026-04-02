import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Languages, 
  Trash2, 
  RefreshCcw, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Cpu,
  RotateCcw,
  Loader2,
  Square,
  Brain
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [thinkingText, setThinkingText] = useState('');
  const [targetLang, setTargetLang] = useState('CAT');
  const [mode, setMode] = useState('NATURAL');
  const [selectedModel, setSelectedModel] = useState('salamandra-ta-7b');
  const [availableModels, setAvailableModels] = useState<string[]>(['salamandra-ta-7b']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [useReasoning, setUseReasoning] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
          const defaultModel = models.find((m: string) => m.toLowerCase().includes('salamandra-ta-7b')) || models[0];
          setSelectedModel(defaultModel);
        }
      } catch (err) {
        console.error('Failed to fetch models', err);
      }
    };
    fetchModels();
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    if (isTranslating) {
      handleStop();
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    
    setIsTranslating(true);
    setTranslatedText('');
    setThinkingText('');
    setLoadingMsg('Iniciant Motor...');
    setStatus(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          text: inputText, 
          target_lang: targetLang,
          mode: mode,
          model: selectedModel,
          use_reasoning: useReasoning
        }),
      });

      if (!response.ok) throw new Error('Backend error');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let currentThinking = false;
      let accumulatedThinking = '';
      let accumulatedTranslation = '';
      let tokensStarted = false;

      const timer = setTimeout(() => {
        if (!tokensStarted) setLoadingMsg('Carregant el model a la VRAM (això triga la primera vegada)...');
      }, 2500);

      let accumulatedBuffer = '';
      let isInsideThink = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!tokensStarted) {
          tokensStarted = true;
          setLoadingMsg(null);
          clearTimeout(timer);
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let content = '';
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            content = data.content;
          } catch (e) { continue; }

          accumulatedBuffer += content;

          // Simple but robust tag parsing with retroactive correction
          while (true) {
            if (!isInsideThink) {
              const startIdx = accumulatedBuffer.indexOf('<think>');
              const endIdx = accumulatedBuffer.indexOf('</think>');
              
              if (startIdx !== -1) {
                // Happy path: found <think>
                const preThink = accumulatedBuffer.substring(0, startIdx);
                if (preThink) {
                  accumulatedTranslation += preThink;
                  setTranslatedText(accumulatedTranslation);
                }
                isInsideThink = true;
                accumulatedBuffer = accumulatedBuffer.substring(startIdx + 7);
                continue;
              } else if (endIdx !== -1) {
                // Retroactive fix: found </think> without <think>
                // Everything before this </think> belongs to thinkingText
                const thought = accumulatedTranslation + accumulatedBuffer.substring(0, endIdx);
                accumulatedThinking += thought;
                setThinkingText(accumulatedThinking);
                accumulatedTranslation = ''; // Clear translation area
                setTranslatedText('');
                isInsideThink = false;
                accumulatedBuffer = accumulatedBuffer.substring(endIdx + 8);
                continue;
              } else {
                // No <think> found yet, but we might have a partial "<thi"
                const partialStart = accumulatedBuffer.lastIndexOf('<');
                if (partialStart !== -1 && '<think>'.startsWith(accumulatedBuffer.substring(partialStart))) {
                  // Keep partial tag in buffer for next chunk
                  const text = accumulatedBuffer.substring(0, partialStart);
                  if (text) {
                    accumulatedTranslation += text;
                    setTranslatedText(accumulatedTranslation);
                  }
                  accumulatedBuffer = accumulatedBuffer.substring(partialStart);
                  break;
                } else {
                  // No partial tag, everything is translation
                  accumulatedTranslation += accumulatedBuffer;
                  setTranslatedText(accumulatedTranslation);
                  accumulatedBuffer = '';
                  break;
                }
              }
            } else {
              const endIdx = accumulatedBuffer.indexOf('</think>');
              if (endIdx !== -1) {
                const thought = accumulatedBuffer.substring(0, endIdx);
                accumulatedThinking += thought;
                setThinkingText(accumulatedThinking);
                isInsideThink = false;
                accumulatedBuffer = accumulatedBuffer.substring(endIdx + 8);
                continue;
              } else {
                // No </think> found, check for partial "</thi"
                const partialEnd = accumulatedBuffer.lastIndexOf('<');
                if (partialEnd !== -1 && '</think>'.startsWith(accumulatedBuffer.substring(partialEnd))) {
                  const thought = accumulatedBuffer.substring(0, partialEnd);
                  if (thought) {
                    accumulatedThinking += thought;
                    setThinkingText(accumulatedThinking);
                  }
                  accumulatedBuffer = accumulatedBuffer.substring(partialEnd);
                  break;
                } else {
                  accumulatedThinking += accumulatedBuffer;
                  setThinkingText(accumulatedThinking);
                  accumulatedBuffer = '';
                  break;
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('User cancelled translation');
      } else {
        console.error('Translation error:', error);
        alert('Error: No se pudo conectar con el motor local.');
      }
    } finally {
      setIsTranslating(false);
      setLoadingMsg(null);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleReset = async () => {
    if (isTranslating) handleStop();
    setInputText('');
    setTranslatedText('');
    setThinkingText('');
    setLoadingMsg('Alliberant Memòria (VRAM)...');
    try {
      await fetch('http://127.0.0.1:8000/unload', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      setTimeout(() => setLoadingMsg(null), 1000);
    } catch (error) {
      console.error('Unload error:', error);
      setLoadingMsg(null);
    }
  };

  const copyToClipboard = async (text: string, type: 'raw' | 'markdown') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'raw') {
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
      } else {
        setCopiedMarkdown(true);
        setTimeout(() => setCopiedMarkdown(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const MODES = [
    { id: 'LITERAL', label: 'Literal', icon: '🎯', desc: 'Exacte i Tècnic' },
    { id: 'NATURAL', label: 'Natural', icon: '🍃', desc: 'Fluïdesa Nativa' },
    { id: 'CREATIVO', label: 'Creatiu', icon: '🎨', desc: 'Transcreació' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans selection:bg-rose-500/30 selection:text-white overflow-hidden">
      {/* Loading Overlay */}
      {loadingMsg && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="text-sm font-mono tracking-widest text-white uppercase">{loadingMsg}</p>
        </div>
      )}

      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between h-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Languages className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">traducció-Xammar</h1>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase mt-1">Motor Local 2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-900/50 rounded-lg px-3 py-1.5 border border-white/5">
            <Cpu className="w-4 h-4 text-rose-500" />
            <select 
              value={selectedModel}
              onChange={async (e) => {
                const newModel = e.target.value;
                if (newModel !== selectedModel) {
                  // Unload previous model to free VRAM
                  try {
                    fetch('http://127.0.0.1:8000/unload', { 
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model: selectedModel })
                    });
                  } catch (err) {
                    console.error('Failed to unload previous model', err);
                  }
                  setSelectedModel(newModel);
                }
              }}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer text-neutral-300 hover:text-white transition-colors"
            >
              {availableModels.map(m => (
                <option key={m} value={m} className="bg-neutral-900 text-white">{m}</option>
              ))}
            </select>
          </div>

          <div className="hidden xl:block text-[9px] text-neutral-600 max-w-[200px] leading-tight italic">
            Nota: Els models de raonament natiu (com R1) seguiran pensant encara que estigui desactivat, cosa que pot alentir el procés.
          </div>

          <div className="flex bg-neutral-900/50 rounded-xl p-1 border border-white/5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group",
                  mode === m.id 
                    ? "bg-neutral-800 text-white shadow-inner" 
                    : "text-neutral-500 hover:text-neutral-300"
                )}
                title={m.desc}
              >
                <span className={cn(mode === m.id ? "opacity-100" : "opacity-40")}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
               onClick={() => setUseReasoning(!useReasoning)}
               className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                 useReasoning 
                   ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" 
                   : "bg-neutral-900/50 text-neutral-500 border-white/5"
               )}
               title={useReasoning ? "Desactivar Raonament" : "Activar Raonament"}
            >
              <Brain className={cn("w-4 h-4", useReasoning && "animate-pulse")} />
              <span>{useReasoning ? "Raonament ON" : "Raonament OFF"}</span>
            </button>

            <button 
              onClick={handleReset}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
              title="Reinicia la sessió i neteja la VRAM"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-white/5 overflow-hidden">
        <div className="flex flex-col relative h-full">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Text d'entrada</span>
            <button onClick={() => setInputText('')} className="text-neutral-500 hover:text-rose-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enganxa el text aquí..."
              className="w-full h-full bg-transparent p-8 outline-none resize-none text-lg leading-relaxed placeholder:text-neutral-700 focus:bg-white/[0.01]"
            />
          </div>
          <div className="p-6 shrink-0 flex justify-end">
            <button
              onClick={handleTranslate}
              disabled={!isTranslating && !inputText.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all min-w-[140px] justify-center",
                isTranslating 
                  ? "bg-neutral-800 text-rose-500 border border-rose-500/20 hover:bg-rose-950/20 active:scale-95 cursor-pointer" 
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/10 active:scale-95"
              )}
            >
              {isTranslating ? <Square className="w-4 h-4 fill-rose-500" /> : <Zap className="w-5 h-5 fill-white" />}
              {isTranslating ? "PARA" : "Traduir"}
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-neutral-900/10 overflow-hidden h-full">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              Previsualització {status === 'passed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/5 mr-2">
                {['ESP', 'CAT', 'ENG'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTargetLang(lang)}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                      targetLang === lang 
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(translatedText, 'markdown')}
                className={cn("px-3 py-1.5 rounded-lg text-xs border border-white/10 transition-all",
                  copiedMarkdown ? "bg-emerald-500 text-black font-bold" : "text-neutral-400 hover:bg-neutral-800")}
              >
                {copiedMarkdown ? "Copiat!" : "Markdown"}
              </button>
              <button
                onClick={() => copyToClipboard(translatedText, 'raw')}
                className={cn("px-3 py-1.5 rounded-lg text-xs border border-white/10 transition-all",
                  copiedRaw ? "bg-white text-black font-bold" : "text-neutral-400 hover:bg-neutral-800")}
              >
                {copiedRaw ? "Copiat!" : "Raw"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 prose prose-invert prose-rose max-w-none min-h-0">
            {useReasoning && thinkingText && (
              <div className="mb-6 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-xs text-neutral-400 flex flex-col overflow-hidden max-h-[200px]">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02] text-neutral-500 uppercase tracking-widest text-[10px] shrink-0">
                  <RefreshCcw className={cn("w-3 h-3", isTranslating && "animate-spin")} />
                  <span>Procés de Raonament / Pensament</span>
                </div>
                <div className="p-4 overflow-auto whitespace-pre-wrap opacity-60 italic leading-relaxed custom-scrollbar">
                  {thinkingText}
                </div>
              </div>
            )}
            {translatedText ? (
              <ReactMarkdown>{translatedText}</ReactMarkdown>
            ) : (
              !thinkingText && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 opacity-50">
                  <ChevronRight className="w-12 h-12 stroke-[1px]" />
                  <p className="text-sm font-mono tracking-widest">PENDENT DE TRADUCCIÓ</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
