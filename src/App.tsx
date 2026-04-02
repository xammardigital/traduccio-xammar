import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Languages, 
  Trash2, 
  RefreshCcw, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Cpu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('CAT');
  const [mode, setMode] = useState('NATURAL');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setStatus(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
          target_lang: targetLang,
          mode: mode
        }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      setTranslatedText(data.translated_text);
      setStatus(data.status);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Error: No se pudo conectar con el Backend (Puerto 8000).');
    } finally {
      setIsTranslating(false);
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

  const unloadModel = async () => {
    try {
      await fetch('http://127.0.0.1:8000/unload', { method: 'POST' });
    } catch (error) {
      console.error('Unload error:', error);
    }
  };

  const MODES = [
    { id: 'LITERAL', label: 'Literal', icon: '🎯', desc: 'Exacto y Técnico' },
    { id: 'NATURAL', label: 'Natural', icon: '🍃', desc: 'Fluidez Nativa' },
    { id: 'CREATIVO', label: 'Creativo', icon: '🎨', desc: 'Transcreación' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans selection:bg-rose-500/30 selection:text-white overflow-hidden">
      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between h-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Languages className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">traduccio-Xammar</h1>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase mt-1">Local Engine 2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Mode Selector */}
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
                {mode === m.id && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/5">
            {['ESP', 'CAT', 'ENG'].map((lang) => (
              <button
                key={lang}
                onClick={() => setTargetLang(lang)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
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
            onClick={unloadModel}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
          >
            <Cpu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-white/5 overflow-hidden">
        <div className="flex flex-col relative h-full">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Input Text</span>
            <button onClick={() => setInputText('')} className="text-neutral-500 hover:text-rose-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text here..."
              className="w-full h-full bg-transparent p-8 outline-none resize-none text-lg leading-relaxed placeholder:text-neutral-700 focus:bg-white/[0.01]"
            />
          </div>
          <div className="p-6 shrink-0 flex justify-end">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                isTranslating 
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/10 active:scale-95"
              )}
            >
              {isTranslating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
              {isTranslating ? "Translating..." : "Translate"}
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-neutral-900/10 overflow-hidden h-full">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              Preview {status === 'passed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(translatedText, 'markdown')}
                className={cn("px-3 py-1.5 rounded-lg text-xs border border-white/10 transition-all",
                  copiedMarkdown ? "bg-emerald-500 text-black font-bold" : "text-neutral-400 hover:bg-neutral-800")}
              >
                {copiedMarkdown ? "Copied!" : "Markdown"}
              </button>
              <button
                onClick={() => copyToClipboard(translatedText, 'raw')}
                className={cn("px-3 py-1.5 rounded-lg text-xs border border-white/10 transition-all",
                  copiedRaw ? "bg-white text-black font-bold" : "text-neutral-400 hover:bg-neutral-800")}
              >
                {copiedRaw ? "Copied!" : "Raw"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 prose prose-invert prose-rose max-w-none min-h-0">
            {translatedText ? (
              <ReactMarkdown>{translatedText}</ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 opacity-50">
                <ChevronRight className="w-12 h-12 stroke-[1px]" />
                <p className="text-sm font-mono tracking-widest">OUTPUT PENDING</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
