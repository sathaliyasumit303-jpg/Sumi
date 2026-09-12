import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileCode,
  Download,
  Copy,
  Check,
  FolderTree,
  ExternalLink,
  ChevronRight,
  Code2,
  Cpu,
  Layers,
} from 'lucide-react';
import { ANDROID_FILES, AndroidFile } from '../android/codebase';

export const AndroidExporter: React.FC = () => {
  const fileList = ANDROID_FILES;
  const [selectedPath, setSelectedPath] = useState<string>(
    ANDROID_FILES[0]?.path || 'app/src/main/java/com/payal/assistant/model/AppCommand.kt'
  );
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = ANDROID_FILES.find((f) => f.path === selectedPath);
  const selectedContent = selectedFile ? selectedFile.content : '';

  const handleCopy = () => {
    if (!selectedContent) return;
    navigator.clipboard.writeText(selectedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Root project wrapper folder
      const root = zip.folder('PayalAssistant') || zip;

      // Add all Android files
      for (const file of ANDROID_FILES) {
        root.file(file.path, file.content);
      }

      // Add README.md for Android Studio instructions
      root.file(
        'README.md',
        `# PAYAL — Android AI Voice Assistant
Production-ready Kotlin + Android Studio project powered by Gemini Live WebSocket API (BidiGenerateContent).

## Requirements
- Android Studio Iguana or newer (Koala/Ladybug recommended)
- Min SDK: 26 (Android 8.0)
- Target SDK: 34 (Android 14)
- JDK: 17 or higher

## Setup Steps
1. Unzip this folder and open \`PayalAssistant\` in Android Studio as an existing project.
2. Allow Gradle to sync dependencies (OkHttp, Coroutines, Jetpack Lifecycle).
3. In \`app/src/main/java/com/payal/assistant/ai/GeminiLiveClient.kt\`, add your Gemini API Key or pass it via SettingsActivity.
4. Run on a physical Android device or emulator with Microphone permissions enabled.
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PayalAssistant_Android_Studio_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Android Studio Project Files
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full font-mono">
                {fileList.length} Files Ready
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono">com.payal.assistant · Min SDK 26 · Target SDK 34 · MVVM</p>
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'Generating .ZIP...' : 'Download Android Studio Project (.ZIP)'}
        </button>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree Explorer */}
        <div className="w-80 border-r border-neutral-800 bg-neutral-950/50 flex flex-col">
          <div className="px-4 py-2.5 border-b border-neutral-800/80 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <FolderTree className="w-3.5 h-3.5 text-red-400" />
            Project Tree ({fileList.length} files)
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            {fileList.map((file) => {
              const isSelected = file.path === selectedPath;
              const isKt = file.path.endsWith('.kt');
              const isXml = file.path.endsWith('.xml');
              const isGradle = file.path.includes('gradle');

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 text-[11px] font-mono transition-colors ${
                    isSelected
                      ? 'bg-red-950/50 text-red-300 border border-red-800/40 font-semibold'
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`}
                >
                  <FileCode
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isKt
                        ? 'text-purple-400'
                        : isXml
                        ? 'text-emerald-400'
                        : isGradle
                        ? 'text-amber-400'
                        : 'text-neutral-400'
                    }`}
                  />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="flex-1 flex flex-col bg-neutral-950/30 overflow-hidden">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/60 text-xs">
            <div className="flex items-center gap-2 text-neutral-300 font-mono text-[11px] truncate">
              <span className="text-neutral-500">Path:</span>
              <span className="text-red-400 truncate">{selectedPath}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Text Area */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-300 bg-neutral-950/90 leading-relaxed selection:bg-red-900 selection:text-white">
            <pre className="whitespace-pre">
              <code>{selectedContent}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
