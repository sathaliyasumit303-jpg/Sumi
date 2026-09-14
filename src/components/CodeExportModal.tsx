import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  FolderArchive,
  ExternalLink,
  X,
  FileCode
} from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [codeContent, setCodeContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'files'>('all');
  const [selectedFile, setSelectedFile] = useState<string>('server.ts');

  useEffect(() => {
    if (isOpen && !codeContent) {
      setLoading(true);
      fetch('/api/payal/download-code')
        .then((res) => res.text())
        .then((text) => {
          setCodeContent(text);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, codeContent]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (codeContent) {
        await navigator.clipboard.writeText(codeContent);
      } else {
        const res = await fetch('/api/payal/download-code');
        const text = await res.text();
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadBlob = async (format: 'txt' | 'md' = 'txt') => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/payal/download-code?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'md' ? 'PAYAL_AI_SOURCE_CODE.md' : 'PAYAL_AI_SOURCE_CODE.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download failed', e);
      window.open(`/api/payal/download-code?format=${format}`, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const filesList = [
    { name: 'server.ts', path: 'server.ts', desc: 'Node/Express बैकएंड, Gemini 3.1 AI, Audio STT, TTS' },
    { name: 'App.tsx', path: 'src/App.tsx', desc: 'पायल का मुख्य UI, वॉइस लूप, डिवाइस ऑटोमेशन' },
    { name: 'PayalBackgroundVoiceService.kt', path: 'src/android/PayalBackgroundVoiceService.kt', desc: '24x7 बैकग्राउंड वॉइस सर्विस (स्क्रीन बंद होने पर भी \'पायल\' सुनकर एक्टिव होना)' },
    { name: 'PermissionManager.kt', path: 'src/android/PermissionManager.kt', desc: 'ऑटोमैटिक परमिशन मैनेजर व बैटरी ऑप्टिमाइज़ेशन बाईपास (Doze Mode)' },
    { name: 'BootReceiver.kt', path: 'src/android/BootReceiver.kt', desc: 'फ़ोन चालू होते ही अपने आप बैकग्राउंड में पायल को स्टार्ट करना' },
    { name: 'AndroidManifest.xml', path: 'src/android/AndroidManifest.xml', desc: 'बैकग्राउंड माइक, वेकलॉक, ऑटो परमिशन व सर्विस कॉन्फ़िगरेशन' },
    { name: 'audioEngine.ts', path: 'src/utils/audioEngine.ts', desc: 'WebAudio, VAD (आवाज़ पहचान), माइक्रोफ़ोन' },
    { name: 'backgroundAudioKeepAlive.ts', path: 'src/utils/backgroundAudioKeepAlive.ts', desc: 'बैकग्राउंड टैब में माइक चालू रखने का लूप' },
    { name: 'commandParser.ts', path: 'src/utils/commandParser.ts', desc: 'हिंदी वॉइस कमांड्स (Call, WhatsApp, YouTube)' },
    { name: 'PayalAvatarView.tsx', path: 'src/components/PayalAvatarView.tsx', desc: 'पायल का 3D/लचीला लोगो व ऐनिमेशन' },
    { name: 'WaveformBarView.tsx', path: 'src/components/WaveformBarView.tsx', desc: 'साउंड वेवफ़ॉर्म बार्स' },
    { name: 'DeviceSimulator.tsx', path: 'src/components/DeviceSimulator.tsx', desc: 'स्मार्टफोन स्क्रीन व ऐप्स सिमुलेटर' },
    { name: 'SettingsModal.tsx', path: 'src/components/SettingsModal.tsx', desc: 'AI सेटिंग्स, संपर्क नंबर व आवाज' },
    { name: 'AndroidExporter.tsx', path: 'src/components/AndroidExporter.tsx', desc: 'Android APK / PWA बनाने का गाइड' },
    { name: 'types.ts', path: 'src/types.ts', desc: 'डेटा टाइप्स और इंटरफेस' },
    { name: 'package.json', path: 'package.json', desc: 'प्रोजेक्ट डिपेंडेंसी व लाइब्रेरी' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                पायल एआई कोड डाउनलोडर (Source Code Export)
              </h2>
              <p className="text-xs text-neutral-400">
                आपकी बनाई हुई Payal AI Voice Assistant का 100% पूरा मुख्य कोड
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-red-950/20 border-b border-red-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadBlob('txt')}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'डाउनलोड हो रहा है...' : 'पूरी कोड फ़ाइल डाउनलोड करें (.txt)'}</span>
            </button>

            <button
              onClick={() => handleDownloadBlob('md')}
              disabled={downloading}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer"
              title="Markdown format with formatting"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>.md फ़ाइल</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-neutral-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">कॉपी हो गया! (Copied)</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-300" />
                <span>पूरा कोड कॉपी करें (Copy All)</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Guide Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <Download className="w-4 h-4 text-red-400" />
                <span>तरीका 1: सीधा कोड फ़ाइल डाउनलोड</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                ऊपर लाल बटन <strong>"पूरी कोड फ़ाइल डाउनलोड करें"</strong> दबाएं। इसमें सर्वर (Gemini AI), फ्रंटएंड, वॉइस VAD इंजन, कमांड्स, सब कुछ एक सिंगल फ़ाइल में क्रमवार मिल जाएगा।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span>तरीका 2: AI Studio से पूरी ZIP डाउनलोड</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                AI Studio स्क्रीन के सबसे ऊपर दाएँ कोने में <strong>⚙️ Settings</strong> या <strong>⋮ (3-dots)</strong> मेन्यू पर क्लिक करें, और <strong>"Download ZIP"</strong> चुनें। इससे हर फ़ाइल अलग-अलग फोल्डर के साथ ZIP में मिल जाएगी।
              </p>
            </div>
          </div>

          {/* Files Included Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>इस कोड में शामिल मुख्य फ़ाइलें (Total 15 Files)</span>
              <span className="text-[11px] text-neutral-500 font-mono">~220 KB Complete Code</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filesList.map((file) => (
                <div
                  key={file.name}
                  className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5"
                >
                  <FileCode className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-mono font-medium text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1">
                      {file.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Code Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                कोड प्रिव्यू (First 150 Lines Preview)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {loading ? 'लोड हो रहा है...' : 'Ready to Download'}
              </span>
            </div>

            <div className="bg-black/90 border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-neutral-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-all selection:bg-red-900 selection:text-white">
              {loading ? (
                <div className="text-neutral-500 py-4 text-center">कोड तैयार किया जा रहा है...</div>
              ) : (
                codeContent.substring(0, 3500) + '\n\n/* ... शेष सभी फ़ाइलों का कोड डाउनलोड की जाने वाली फ़ाइल में उपलब्ध है ... */'
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>पायल (Payal) - आपकी अपनी वॉइस एआई साथी</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
