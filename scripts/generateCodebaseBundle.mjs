import fs from 'fs';
import path from 'path';

const root = process.cwd();

const targetFiles = [
  { name: 'package.json', path: 'package.json', desc: 'डिपेंडेंसी, स्क्रिप्ट्स व लाइब्रेरी कॉन्फ़िगरेशन' },
  { name: 'server.ts', path: 'server.ts', desc: 'Express बैकएंड सर्वर, Gemini 3.1 AI API, वॉइस STT & TTS' },
  { name: 'src/types.ts', path: 'src/types.ts', desc: 'डेटा टाइप्स और इंटरफेस' },
  { name: 'src/App.tsx', path: 'src/App.tsx', desc: 'पायल का मुख्य UI, वॉइस लूप व ऑटोमेशन इंजन' },
  { name: 'src/android/PayalBackgroundVoiceService.kt', path: 'src/android/PayalBackgroundVoiceService.kt', desc: '24x7 बैकग्राउंड वॉइस सर्विस (स्क्रीन बंद होने पर भी \'पायल\' सुनकर तुरंत एक्टिव होना)' },
  { name: 'src/android/PermissionManager.kt', path: 'src/android/PermissionManager.kt', desc: 'ऑटोमैटिक परमिशन मैनेजर व बैटरी ऑप्टिमाइज़ेशन बाईपास (Doze Mode बाईपास)' },
  { name: 'src/android/BootReceiver.kt', path: 'src/android/BootReceiver.kt', desc: 'फ़ोन स्विच ऑन / रीबूट होते ही पायल सर्विस अपने आप शुरू करना' },
  { name: 'src/android/AndroidManifest.xml', path: 'src/android/AndroidManifest.xml', desc: 'बैकग्राउंड माइक, वेकलॉक, ऑटो परमिशन व सर्विस मेनिफेस्ट' },
  { name: 'src/utils/audioEngine.ts', path: 'src/utils/audioEngine.ts', desc: 'WebAudio, VAD (वॉइस डिटेक्शन) व माइक रिकॉर्डिंग' },
  { name: 'src/utils/backgroundAudioKeepAlive.ts', path: 'src/utils/backgroundAudioKeepAlive.ts', desc: 'वेब ब्राउज़र बैकग्राउंड ऑडियो लूप व वेकलॉक' },
  { name: 'src/utils/commandParser.ts', path: 'src/utils/commandParser.ts', desc: 'हिंदी वॉइस कमांड्स पार्सर (कॉल, व्हाट्सएप, यूट्यूब आदि)' },
  { name: 'src/utils/textCleaner.ts', path: 'src/utils/textCleaner.ts', desc: 'टेक्स्ट व इमोजी क्लीनर' },
  { name: 'src/components/PayalAvatarView.tsx', path: 'src/components/PayalAvatarView.tsx', desc: 'पायल का इंटरैक्टिव 3D लोगो व ऐनिमेशन' },
  { name: 'src/components/WaveformBarView.tsx', path: 'src/components/WaveformBarView.tsx', desc: 'साउंड वेवफ़ॉर्म विज़ुअलाइज़र' },
  { name: 'src/components/SettingsModal.tsx', path: 'src/components/SettingsModal.tsx', desc: 'AI सेटिंग्स, संपर्क व आवाज चयन' },
  { name: 'src/components/DeviceSimulator.tsx', path: 'src/components/DeviceSimulator.tsx', desc: 'स्मार्टफ़ोन स्क्रीन व ऐप्स सिमुलेटर' },
  { name: 'src/components/AndroidExporter.tsx', path: 'src/components/AndroidExporter.tsx', desc: 'Android APK / PWA गाइड' },
  { name: 'src/components/CodeExportModal.tsx', path: 'src/components/CodeExportModal.tsx', desc: 'कोड डाउनलोड व कॉपी मॉडल' },
  { name: 'src/index.css', path: 'src/index.css', desc: 'Tailwind CSS स्टाइल्स' },
  { name: 'index.html', path: 'index.html', desc: 'HTML एंट्री पॉइंट' }
];

const timestamp = new Date().toISOString();

// 1. Build TXT bundle
let txt = `================================================================================
PAYAL - AI VOICE ASSISTANT (पायल एआई वॉइस साथी) - COMPLETE MAIN CODEBASE
Generated at: ${timestamp}
================================================================================

TABLE OF CONTENTS:
`;

targetFiles.forEach((f, idx) => {
  txt += `${idx + 1}. ${f.path} - ${f.desc}\n`;
});

txt += `\n================================================================================\n\n`;

for (const f of targetFiles) {
  const fullPath = path.join(root, f.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    txt += `/* ########################################################################## */\n`;
    txt += `/* FILE: ${f.path} */\n`;
    txt += `/* DESCRIPTION: ${f.desc} */\n`;
    txt += `/* ########################################################################## */\n\n`;
    txt += content.trim();
    txt += `\n\n/* [END OF FILE: ${f.path}] */\n\n`;
  } else {
    console.warn(`File not found: ${f.path}`);
  }
}

fs.writeFileSync(path.join(root, 'PAYAL_AI_SOURCE_CODE.txt'), txt, 'utf-8');
console.log('Successfully wrote PAYAL_AI_SOURCE_CODE.txt, size:', txt.length);

// 2. Build Markdown bundle
let md = `# PAYAL - AI VOICE ASSISTANT (पायल एआई वॉइस साथी)
> सम्पूर्ण मुख्य सोर्स कोड (Complete Source Code Bundle)  
> Generated at: ${timestamp}

---

## 📑 फ़ाइलों की सूची (Table of Contents)

`;

targetFiles.forEach((f, idx) => {
  const anchor = f.path.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  md += `${idx + 1}. [**${f.path}**](#${anchor}) - *${f.desc}*\n`;
});

md += `\n---\n\n`;

for (const f of targetFiles) {
  const fullPath = path.join(root, f.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(f.path).replace('.', '');
    const lang = ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'kt' ? 'kotlin' : ext === 'xml' ? 'xml' : ext === 'json' ? 'json' : ext === 'css' ? 'css' : ext === 'html' ? 'html' : '';
    const anchor = f.path.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    md += `## <a id="${anchor}"></a>📁 \`${f.path}\`\n`;
    md += `**विवरण:** ${f.desc}\n\n`;
    md += '```' + lang + '\n';
    md += content.trim();
    md += '\n```\n\n---\n\n';
  }
}

fs.writeFileSync(path.join(root, 'PAYAL_AI_SOURCE_CODE.md'), md, 'utf-8');
console.log('Successfully wrote PAYAL_AI_SOURCE_CODE.md, size:', md.length);
