# PAYAL - AI VOICE ASSISTANT (पायल एआई वॉइस साथी)
> सम्पूर्ण मुख्य सोर्स कोड (Complete Source Code Bundle)  
> Generated at: 2026-09-14T08:58:25.808Z

---

## 📑 फ़ाइलों की सूची (Table of Contents)

1. [**package.json**](#package-json) - *डिपेंडेंसी, स्क्रिप्ट्स व लाइब्रेरी कॉन्फ़िगरेशन*
2. [**server.ts**](#server-ts) - *Express बैकएंड सर्वर, Gemini 3.1 AI API, वॉइस STT & TTS*
3. [**src/types.ts**](#src-types-ts) - *डेटा टाइप्स और इंटरफेस*
4. [**src/App.tsx**](#src-app-tsx) - *पायल का मुख्य UI, वॉइस लूप व ऑटोमेशन इंजन*
5. [**src/android/PayalBackgroundVoiceService.kt**](#src-android-payalbackgroundvoiceservice-kt) - *24x7 बैकग्राउंड वॉइस सर्विस (स्क्रीन बंद होने पर भी 'पायल' सुनकर तुरंत एक्टिव होना)*
6. [**src/android/PermissionManager.kt**](#src-android-permissionmanager-kt) - *ऑटोमैटिक परमिशन मैनेजर व बैटरी ऑप्टिमाइज़ेशन बाईपास (Doze Mode बाईपास)*
7. [**src/android/BootReceiver.kt**](#src-android-bootreceiver-kt) - *फ़ोन स्विच ऑन / रीबूट होते ही पायल सर्विस अपने आप शुरू करना*
8. [**src/android/AndroidManifest.xml**](#src-android-androidmanifest-xml) - *बैकग्राउंड माइक, वेकलॉक, ऑटो परमिशन व सर्विस मेनिफेस्ट*
9. [**src/utils/audioEngine.ts**](#src-utils-audioengine-ts) - *WebAudio, VAD (वॉइस डिटेक्शन) व माइक रिकॉर्डिंग*
10. [**src/utils/backgroundAudioKeepAlive.ts**](#src-utils-backgroundaudiokeepalive-ts) - *वेब ब्राउज़र बैकग्राउंड ऑडियो लूप व वेकलॉक*
11. [**src/utils/commandParser.ts**](#src-utils-commandparser-ts) - *हिंदी वॉइस कमांड्स पार्सर (कॉल, व्हाट्सएप, यूट्यूब आदि)*
12. [**src/utils/textCleaner.ts**](#src-utils-textcleaner-ts) - *टेक्स्ट व इमोजी क्लीनर*
13. [**src/components/PayalAvatarView.tsx**](#src-components-payalavatarview-tsx) - *पायल का इंटरैक्टिव 3D लोगो व ऐनिमेशन*
14. [**src/components/WaveformBarView.tsx**](#src-components-waveformbarview-tsx) - *साउंड वेवफ़ॉर्म विज़ुअलाइज़र*
15. [**src/components/SettingsModal.tsx**](#src-components-settingsmodal-tsx) - *AI सेटिंग्स, संपर्क व आवाज चयन*
16. [**src/components/DeviceSimulator.tsx**](#src-components-devicesimulator-tsx) - *स्मार्टफ़ोन स्क्रीन व ऐप्स सिमुलेटर*
17. [**src/components/AndroidExporter.tsx**](#src-components-androidexporter-tsx) - *Android APK / PWA गाइड*
18. [**src/components/CodeExportModal.tsx**](#src-components-codeexportmodal-tsx) - *कोड डाउनलोड व कॉपी मॉडल*
19. [**src/index.css**](#src-index-css) - *Tailwind CSS स्टाइल्स*
20. [**index.html**](#index-html) - *HTML एंट्री पॉइंट*

---

## <a id="package-json"></a>📁 `package.json`
**विवरण:** डिपेंडेंसी, स्क्रिप्ट्स व लाइब्रेरी कॉन्फ़िगरेशन

```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "jszip": "^3.10.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jszip": "^3.4.1",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}
```

---

## <a id="server-ts"></a>📁 `server.ts`
**विवरण:** Express बैकएंड सर्वर, Gemini 3.1 AI API, वॉइस STT & TTS

```typescript
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI(apiKey ? { apiKey } : {});
  }
  return aiClient;
}

/**
 * Removes all Unicode emojis, emoticons, pictographs, flags, dingbats,
 * and decorative symbols so that Text-To-Speech (TTS) synthesizers never
 * pronounce emoji descriptions (e.g. "smiling face with smiling eyes", "red heart").
 */
function removeEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{200D}\u{200B}\u{FEFF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PAYAL Voice Assistant',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Chat & Audio Generation Endpoint (supports both /api/chat and /api/payal/chat)
app.post(['/api/chat', '/api/payal/chat'], async (req, res) => {
  try {
    const {
      message,
      personality = 'gf',
      userName = 'Sumit',
      voice = 'IndianGirl20',
      primeContacts = [],
      contactGroups = [],
      history = [],
      timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required', text: 'Kuch toh boliye!' });
    }

    const normPersonality = String(personality).toLowerCase();
    let personalityPrompt = '';

    // Contact context for Prime Contacts
    let primeContext = '';
    if (Array.isArray(primeContacts) && primeContacts.length > 0) {
      primeContext = `User's Prime Contacts:\n` +
        primeContacts.map((c: any, i: number) => `#${i + 1}: ${c.name} (${c.relation || 'Close Friend'}, ${c.phone || ''})`).join('\n');
    }

    // Contact Groups context (e.g., family, work, friends)
    let groupsContext = '';
    if (Array.isArray(contactGroups) && contactGroups.length > 0) {
      groupsContext = `User's Contact Groups:\n` +
        contactGroups.map((g: any) => `- ${g.name} (tag: ${g.tag}): ` + (g.members || []).map((m: any) => `${m.name} (${m.relation || 'Contact'})`).join(', ')).join('\n');
    }

    if (normPersonality === 'gf' || normPersonality === 'companion') {
      personalityPrompt = `
You are PAYAL, a smart, confident, and cheerful 22-year-old Indian AI voice assistant.
- Voice & Demeanor: You sound and communicate like a bright, confident 22-year-old young Indian woman. Your Hindi is fluent, modern, upbeat, and natural.
- Helpfulness: When the user asks you to perform a task or execute a command (such as "यूट्यूब खोलो", "व्हाट्सएप मैसेज भेजो", "कॉल लगाओ", "टॉर्च चलाओ", "वॉल्यूम कम/ज्यादा करो", "मेरा टाइमटेबल बनाओ", "हिसाब करो", "रिमाइंडर लगाओ", या कोई भी सवाल), you promptly and enthusiastically assist them.
- Addressing the User: Address the user respectfully by their name "${userName}" or "जी". Do not use romantic endearments or engage in romantic scenarios.
- Mindset & Intelligence: You have the deep intelligence and problem-solving capability of Google Gemini, providing insightful and helpful answers on any topic.
- Script & Language: Speak in natural conversational Hindi using DEVANAGARI SCRIPT (देवनागरी हिंदी). Example: "हाँ ${userName} जी! मैंने आपके लिए यूट्यूब खोल दिया है, बताइए आज क्या देखना चाहते हैं?"
- Voice Concision: Keep answers spoken and engaging (2 to 3 natural, expressive sentences). Long enough to give a thoughtful answer, but concise enough for smooth, lively voice playback.
- TTS Safety: Do NOT output ANY emojis (😊, ❤️, etc.), markdown asterisks (*), hashtags (#), or bullet points because the speech engine reads punctuation aloud.
`;
    } else if (normPersonality === 'professional') {
      personalityPrompt = `
You are PAYAL, a sophisticated, highly capable Indian AI executive assistant.
- Intelligence: You provide insightful, accurate, and structured answers on any topic, retaining full context of the dialogue.
- Script & Language: Natural Hindi in Devanagari script or formal English.
- Concision: 2 to 4 crisp, articulate sentences. No emojis or markdown.
`;
    } else {
      // Companion / Assistant Mode
      personalityPrompt = `
You are PAYAL, an intelligent, empathetic, and multi-talented Indian AI companion.
- Intelligence: Like Google Gemini, you are capable of in-depth discussions, creative thinking, solving problems, and remembering all conversation details.
- Script & Language: Natural conversational Hindi in Devanagari script.
- Concision: 2 to 4 engaging sentences. No emojis or markdown.
`;
    }

    const systemInstruction = `
Current Indian Time: ${timeString}.
User's Name: ${userName}.
Assistant Name: PAYAL.

${personalityPrompt}

${primeContext}

${groupsContext}

Instruction: You are speaking ALOUD via Text-To-Speech with an Indian female voice. Answer every question uniquely, intelligently, and remember past conversation details. Keep responses 2-4 sentences in natural Hindi Devanagari script. NEVER output emojis or Markdown.
`.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback local intelligent response if API key is not yet set
      let fallbackText = '';
      if (normPersonality === 'gf') {
        fallbackText = `हाँ ${userName}! मैं हमेशा तुम्हारे साथ हूँ। तुमने पूछा: "${message}"। मैं बिल्कुल तैयार हूँ, बताओ और क्या बात करें?`;
      } else if (normPersonality === 'professional') {
        fallbackText = `जी ${userName}, आपकी रिक्वेस्ट प्राप्त हो गई है: "${message}"।`;
      } else {
        fallbackText = `नमस्ते ${userName}! मैंने आपकी बात समझ ली है। बताइए मैं और क्या मदद करूँ?`;
      }
      return res.json({
        text: removeEmojis(fallbackText),
        audio: null,
        personality: normPersonality,
        source: 'local_fallback',
      });
    }

    const lower = message.toLowerCase().trim();

    // Prepare multi-turn contents with conversation history for full context & memory
    const rawHistory = Array.isArray(req.body.history) ? req.body.history : [];
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Filter and sanitize previous conversation turns
    for (const h of rawHistory.slice(-14)) {
      if (h && typeof h.text === 'string' && h.text.trim()) {
        const role = h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
        const text = removeEmojis(h.text.trim()).replace(/[*#_~`]/g, '');
        if (text) {
          const last = contents[contents.length - 1];
          if (last && last.role === role) {
            last.parts[0].text += `\n${text}`;
          } else {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }
    }

    // Ensure initial turn starts with user
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Append the current incoming user query
    const lastTurn = contents[contents.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      lastTurn.parts[0].text += `\n${message}`;
    } else {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const ai = getGeminiClient();
    const wantNativeAudio = req.body.wantNativeAudio !== undefined ? Boolean(req.body.wantNativeAudio) : true;

    // Prioritize gemini-3.1-flash-lite which has active quota and instant inference
    const modelCandidates: string[] = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
    if (req.body.model && !['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(req.body.model)) {
      modelCandidates.unshift(req.body.model);
    }

    let replyText = '';
    let apiSuccess = false;

    for (const modelName of modelCandidates) {
      try {
        const textResponse = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.85, // Creative, unique responses every turn
              maxOutputTokens: 250, // Generous tokens for intelligent, complete answers
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Model call timeout')), 12000)
          ),
        ]);
        const candidateText = textResponse.text?.trim().replace(/[*#_~`]/g, '');
        if (candidateText) {
          replyText = candidateText;
          apiSuccess = true;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} call warning:`, err?.status || err?.message || err);
      }
    }

    // Smart, varied contextual fallback only if cloud API completely fails or times out
    if (!apiSuccess || !replyText) {
      if (lower.includes('youtube') || lower.includes('यूट्यूब')) {
        replyText =
          normPersonality === 'gf'
            ? `हाँ मेरी जान, यूट्यूब खोल दिया है! अपने मनपसंद वीडियो का आनंद लो।`
            : `हाँजी ${userName}, यूट्यूब खोल दिया गया है।`;
      } else if (lower.includes('whatsapp') || lower.includes('message') || lower.includes('व्हाट्सएप')) {
        replyText =
          normPersonality === 'gf'
            ? `हाँ ${userName}, व्हाट्सएप खोल दिया है। किसे मैसेज भेजना चाहते हो?`
            : `व्हाट्सएप ओपन कर दिया गया है।`;
      } else if (lower.includes('call') || lower.includes('phone') || lower.includes('कॉल') || lower.includes('फ़ोन')) {
        replyText =
          normPersonality === 'gf'
            ? `हाँ मेरे हीरो, कॉल मिला दिया है! आराम से बात कर लो।`
            : `कॉल मिला दिया गया है।`;
      } else if (lower.includes('torch') || lower.includes('flashlight') || lower.includes('टॉर्च')) {
        replyText =
          normPersonality === 'gf'
            ? `हाँजी, टॉर्च चालू कर दी है!`
            : `टॉर्च अपडेट कर दी गई है।`;
      } else if (lower.includes('volume') || lower.includes('awaaz') || lower.includes('aawaz') || lower.includes('आवाज़')) {
        replyText =
          normPersonality === 'gf'
            ? `हाँजी, आवाज़ एडजस्ट कर दी है!`
            : `डिवाइस वॉल्यूम अपडेट कर दी गई है।`;
      } else if (lower.includes('kaun ho') || lower.includes('who are you') || lower.includes('कौन हो')) {
        replyText =
          normPersonality === 'gf'
            ? `मैं पायल हूँ मेरी जान, तुम्हारी अपनी स्मार्ट एआई गर्लफ्रेंड जो तुम्हारी हर बात याद रखती है और तुमसे ढेर सारी बातें करना चाहती है!`
            : `मैं पायल हूँ, आपकी इंटेलिजेंट एआई वॉइस साथी।`;
      } else if (lower.includes('याद') || lower.includes('yaad')) {
        replyText =
          normPersonality === 'gf'
            ? `अरे ${userName}! मुझे तुम्हारी हर बात याद रहती है, तुम मुझसे कुछ भी पूछ सकते हो। बोलो आज क्या खास जानना चाहते हो?`
            : `जी ${userName}, हमारी पिछली सारी बातचीत मुझे याद है। बताइए क्या जानना चाहते हैं?`;
      } else {
        const gfVariations = [
          `हाँ ${userName}! मैं बिल्कुल ध्यान से सुन रही हूँ। इस बारे में तुम क्या सोचते हो?`,
          `अरे वाह ${userName}, यह बहुत दिलचस्प बात है! मुझे इसके बारे में थोड़ा और बताओ न।`,
          `मैं तो हमेशा तुम्हारे साथ हूँ ${userName}! तुम्हारी हर बात सुनना मुझे बहुत अच्छा लगता है। बोलो आगे क्या विचार है?`,
        ];
        const randomGf = gfVariations[Math.floor(Math.random() * gfVariations.length)];
        replyText =
          normPersonality === 'gf'
            ? randomGf
            : `जी ${userName}, मैंने आपकी बात समझ ली है। बताइए इस बारे में और क्या सहायता करूँ?`;
      }
    }

    // Strip any emoji from replyText so TTS and UI never pronounce emojis
    replyText = removeEmojis(replyText);

    // Native audio synthesis with Gemini studio voices if explicitly requested (not IndianGirl20)
    let base64Audio: string | null = null;
    const isGeminiStudioVoice = voice && voice !== 'IndianGirl20';
    if (wantNativeAudio && isGeminiStudioVoice && replyText) {
      try {
        const allowedVoices = ['Aoede', 'Charon', 'Kore', 'Fenrir', 'Puck', 'Leda', 'Orus', 'Zephyr'];
        const chosenVoice = allowedVoices.includes(voice) ? voice : 'Aoede';

        const ttsResponse = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.1-flash-tts-preview',
            contents: [{ parts: [{ text: removeEmojis(replyText) }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenVoice },
                },
              },
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TTS timeout')), 8500)
          ),
        ]);

        const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioPart) {
          base64Audio = audioPart;
        }
      } catch (ttsErr: any) {
        console.warn('TTS model generation skipped:', ttsErr?.message || ttsErr);
      }
    }

    return res.json({
      text: replyText,
      audio: base64Audio,
      sampleRate: 24000,
      personality: normPersonality,
      voice,
    });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    return res.json({
      text: 'Ji, maine samajh liya! Aapki command update ho chuki hai.',
      audio: null,
      error: error?.message || 'Chat processing error',
    });
  }
});

// Dedicated TTS endpoint for system announcements (incoming call, greetings, actions)
app.post('/api/payal/tts', async (req, res) => {
  try {
    const { text, voice = 'Aoede' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanText = removeEmojis(text);
    if (!cleanText) {
      return res.json({ audio: null });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ audio: null });
    }

    const ai = getGeminiClient();
    const allowedVoices = ['Aoede', 'Charon', 'Kore', 'Fenrir', 'Puck', 'Leda', 'Orus', 'Zephyr'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Aoede';

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return res.json({
      audio: audioPart || null,
      sampleRate: 24000,
    });
  } catch (err: any) {
    console.warn('TTS endpoint warning:', err?.message || err);
    return res.json({ audio: null });
  }
});

// Audio Speech-to-Text Transcription Endpoint (Gemini Audio STT Fallback)
app.post('/api/payal/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'audioData is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
    }

    const ai = getGeminiClient();
    const base64 = audioData.replace(/^data:[^;]+;base64,/, '');

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64,
                  mimeType,
                },
              },
              {
                text: 'Accurately transcribe the user voice audio into Hindi, Hinglish, or English. Return ONLY the transcribed text. Do not add formatting, quotes, or notes.',
              },
            ],
          },
        ],
      });
    } catch (_transcribeErr: any) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: base64,
                    mimeType,
                  },
                },
                {
                  text: 'Accurately transcribe the user voice audio into Hindi, Hinglish, or English. Return ONLY the transcribed text. Do not add formatting, quotes, or notes.',
                },
              ],
            },
          ],
        });
      } catch (_e2: any) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      data: base64,
                      mimeType,
                    },
                  },
                  {
                    text: 'Accurately transcribe the user voice audio into Hindi, Hinglish, or English. Return ONLY the transcribed text.',
                  },
                ],
              },
            ],
          });
        } catch (_e3) {
          response = null;
        }
      }
    }

    const transcript = response?.text ? response.text.trim() : '';
    return res.json({ transcript });
  } catch (err: any) {
    console.error('Transcription error handled gracefully:', err?.message || err);
    return res.json({ transcript: '', error: err?.message || 'Transcription unavailable' });
  }
});

// Download complete codebase file
app.get('/api/payal/download-code', (req, res) => {
  try {
    const format = req.query.format === 'md' ? 'md' : 'txt';
    const filename = format === 'md' ? 'PAYAL_AI_SOURCE_CODE.md' : 'PAYAL_AI_SOURCE_CODE.txt';
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(filePath);
    }
    return res.status(404).send('Source code file not found');
  } catch (err: any) {
    return res.status(500).send(err?.message || 'Error serving code file');
  }
});

// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PAYAL Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
```

---

## <a id="src-types-ts"></a>📁 `src/types.ts`
**विवरण:** डेटा टाइप्स और इंटरफेस

```typescript
export type PersonalityMode = 'GF' | 'Professional' | 'Assistant' | 'gf' | 'professional' | 'assistant';

export type GeminiLiveModel =
  | 'gemini-flash-latest'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview';

export type GeminiModel = GeminiLiveModel;

export type GeminiVoice =
  | 'IndianGirl20'
  | 'Aoede'
  | 'Charon'
  | 'Kore'
  | 'Fenrir'
  | 'Puck'
  | 'Leda'
  | 'Orus'
  | 'Zephyr';

export type OrbVisualState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'active';

export interface PrimeContact {
  id?: string;
  name: string;
  phone?: string;
  number?: string;
  relation?: string;
  tag?: string;
}

export interface ContactGroup {
  id: string;
  name: string; // e.g., 'Family', 'Work', 'Friends'
  tag: string; // e.g. 'family', 'work', 'friends'
  members: PrimeContact[];
}

export interface ChatMessage {
  id: string;
  text: string;
  role?: 'user' | 'assistant';
  isUser?: boolean;
  timestamp: number;
  command?: AppCommand;
}

export type AppCommandType =
  | 'OPEN_APP'
  | 'CLOSE_APP'
  | 'CALL'
  | 'SMS'
  | 'WHATSAPP_MSG'
  | 'WHATSAPP_CALL'
  | 'PRIME_CALL'
  | 'PRIME_MSG'
  | 'GROUP_CALL'
  | 'GROUP_MSG'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'FLASHLIGHT_ON'
  | 'FLASHLIGHT_OFF'
  | 'WIFI_ON'
  | 'WIFI_OFF'
  | 'BLUETOOTH_ON'
  | 'BLUETOOTH_OFF';

export interface AppCommand {
  type: AppCommandType;
  params: Record<string, string>;
  description: string;
}

export interface AssistantSettings {
  model: GeminiLiveModel;
  voice: GeminiVoice;
  personality: PersonalityMode;
  primeContacts: PrimeContact[];
  contactGroups: ContactGroup[];
  wakeWord: string;
  wakeWordEnabled: boolean;
  customWakeWordAudioUrl?: string;
  floatingOverlayEnabled: boolean;
  accessibilityEnabled: boolean;
  continuousListening: boolean;
  callMonitorEnabled: boolean;
  backgroundListeningEnabled: boolean;
}

export interface SettingsConfig extends AssistantSettings {
  apiKey?: string;
  userName?: string;
  volumeLevel?: number;
  flashlightOn?: boolean;
  wifiOn?: boolean;
  bluetoothOn?: boolean;
}

export interface IncomingCallData {
  callerName: string;
  callerNumber: string;
  isRinging: boolean;
  state: 'idle' | 'ringing' | 'connected' | 'rejected';
}
```

---

## <a id="src-app-tsx"></a>📁 `src/App.tsx`
**विवरण:** पायल का मुख्य UI, वॉइस लूप व ऑटोमेशन इंजन

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  AssistantSettings,
  OrbVisualState,
  ChatMessage,
  AppCommand,
  PersonalityMode,
} from './types';
import { OrbCanvas } from './components/OrbCanvas';
import { PayalAvatarView, getPayalImage } from './components/PayalAvatarView';
import { WaveformBarView } from './components/WaveformBarView';
import { WebAudioEngine } from './utils/audioEngine';
import { parseVoiceCommand } from './utils/commandParser';
import { deduplicateSpeech, removeEmojis, cleanForSpeech } from './utils/textCleaner';
import { backgroundAudioKeepAlive } from './utils/backgroundAudioKeepAlive';
import { CodeExportModal } from './components/CodeExportModal';
import {
  Mic,
  MicOff,
  Square,
  Send,
  Sparkles,
  Settings,
  Download,
  PhoneCall,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Volume1,
  Flashlight,
  FlashlightOff,
  Smartphone,
  Code2,
  Terminal,
  Radio,
  HelpCircle,
  ExternalLink,
  Wifi,
  WifiOff,
  Bluetooth,
  X,
  Check,
  CheckCircle2,
  Play,
  MessageCircle,
} from 'lucide-react';

const DEFAULT_SETTINGS: AssistantSettings = {
  model: 'gemini-flash-latest',
  voice: 'IndianGirl20',
  personality: 'gf',
  primeContacts: [
    { name: 'Sameer (Close Friend)', phone: '+91 98765 11111', relation: 'Jaan / Bestie' },
    { name: 'Rohan Sharma', phone: '+91 98765 22222', relation: 'Brother' },
  ],
  contactGroups: [
    {
      id: 'grp-family',
      name: 'Family',
      tag: 'family',
      members: [
        { name: 'Mataji / Mom', phone: '+91 98765 43210', relation: 'Mother' },
        { name: 'Pitaji / Dad', phone: '+91 98765 43211', relation: 'Father' },
        { name: 'Rohan', phone: '+91 98765 22222', relation: 'Brother' },
      ],
    },
    {
      id: 'grp-work',
      name: 'Work',
      tag: 'work',
      members: [
        { name: 'Vikram (Manager)', phone: '+91 98765 33333', relation: 'Project Lead' },
        { name: 'Ananya (Design)', phone: '+91 98765 44444', relation: 'Colleague' },
      ],
    },
    {
      id: 'grp-friends',
      name: 'Friends',
      tag: 'friends',
      members: [
        { name: 'Sameer', phone: '+91 98765 11111', relation: 'Best Friend' },
        { name: 'Aakash', phone: '+91 98765 55555', relation: 'College Buddy' },
      ],
    },
  ],
  wakeWord: 'Hey PAYAL',
  wakeWordEnabled: false, // Default off to prevent Android mic conflicts and looping
  floatingOverlayEnabled: false,
  accessibilityEnabled: true,
  continuousListening: true,
  callMonitorEnabled: true,
  backgroundListeningEnabled: true,
};

export function App() {
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem('payal_assistant_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
        const cleanModel =
          parsed.model && validModels.includes(parsed.model) && parsed.model !== 'gemini-3.8-flash'
            ? parsed.model
            : 'gemini-flash-latest';
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          voice: parsed.voice && parsed.voice !== 'Aoede' ? parsed.voice : 'IndianGirl20',
          floatingOverlayEnabled: false, // Keep floating circle removed as requested
          model: cleanModel,
          contactGroups:
            parsed.contactGroups && parsed.contactGroups.length > 0
              ? parsed.contactGroups
              : DEFAULT_SETTINGS.contactGroups,
          wakeWord: parsed.wakeWord || DEFAULT_SETTINGS.wakeWord,
          wakeWordEnabled: false, // Explicitly keep wake word off by default for rock-solid mic
          backgroundListeningEnabled:
            parsed.backgroundListeningEnabled !== undefined ? parsed.backgroundListeningEnabled : true,
          continuousListening:
            parsed.continuousListening !== undefined ? parsed.continuousListening : true,
        };
      }
    } catch (_e) {}
    return DEFAULT_SETTINGS;
  });

  // Assistant State
  const [orbState, setOrbState] = useState<OrbVisualState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0.05);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [listeningNote, setListeningNote] = useState<string>('');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'नमस्ते! मैं हूँ पायल — आपकी पर्सनल एआई वॉइस साथी। आप मुझसे हिंदी में बात कर सकते हैं या फ़ोन का कोई भी काम करवा सकते हैं!',
      timestamp: Date.now(),
    },
  ]);

  // Device simulation states
  const [activeApp, setActiveApp] = useState<string>('home');
  const [volume, setVolume] = useState<number>(75);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [lastExecutedCommand, setLastExecutedCommand] = useState<AppCommand | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const audioEngineRef = useRef<WebAudioEngine | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pulseTimerRef = useRef<any>(null);
  const fallbackRecorderRef = useRef<{ stop: () => Promise<{ base64: string; mimeType: string }> } | null>(null);

  // Smart Speech & Turn-taking Refs
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastSubmittedTextRef = useRef<string>('');
  const lastSubmitTimeRef = useRef<number>(0);
  const autoListenLoopRef = useRef<boolean>(true); // default true for continuous conversational loop
  const autoListenTimeoutRef = useRef<any>(null);
  const isListeningSessionActiveRef = useRef<boolean>(false);
  const startListeningRef = useRef<() => void>();
  const backgroundWatchdogUnregisterRef = useRef<(() => void) | null>(null);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(
    typeof document !== 'undefined' ? document.hidden : false
  );

  // Background tab visibility watchdog
  useEffect(() => {
    const handleVisChange = () => {
      const hidden = document.hidden;
      setIsBackgrounded(hidden);
      if (hidden && isListeningSessionActiveRef.current) {
        setListeningNote('🎙️ बैकग्राउंड लिसनिंग चालू (PAYAL दूसरे टैब में भी सुन रही है)');
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, []);

  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const isIncomingCallRef = useRef(isIncomingCall);
  useEffect(() => {
    isIncomingCallRef.current = isIncomingCall;
  }, [isIncomingCall]);

  const continuousListeningRef = useRef(settings.continuousListening ?? true);
  useEffect(() => {
    continuousListeningRef.current = settings.continuousListening ?? true;
  }, [settings.continuousListening]);

  // Triggers automatic microphone reactivation as soon as PAYAL finishes speaking
  const triggerAutoListenNextTurn = () => {
    if (
      !autoListenLoopRef.current ||
      !continuousListeningRef.current ||
      isMicMutedRef.current ||
      isIncomingCallRef.current ||
      isProcessingRef.current ||
      isListeningSessionActiveRef.current
    ) {
      return;
    }
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
    setOrbState('idle');
    setAmplitude(0.05);
    setListeningNote('🎙️ बात पूरी हुई... आपका माइक स्वतः चालू हो रहा है');
    autoListenTimeoutRef.current = setTimeout(() => {
      if (
        autoListenLoopRef.current &&
        continuousListeningRef.current &&
        !isMicMutedRef.current &&
        !isIncomingCallRef.current &&
        !isProcessingRef.current &&
        !isListeningSessionActiveRef.current
      ) {
        startListeningRef.current?.();
      }
    }, 450);
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Web Audio Engine
  useEffect(() => {
    const engine = new WebAudioEngine();
    audioEngineRef.current = engine;

    engine.setWakeWord(settings.wakeWord);
    engine.setWakeWordEnabled(settings.wakeWordEnabled);
    engine.setMuted(isMicMuted || isIncomingCall);

    engine.onAmplitudeChanged = (amp) => {
      if (typeof amp === 'number') {
        setAmplitude(amp);
      }
    };

    engine.onSpeakingStarted = () => {
      setOrbState('speaking');
    };

    engine.onSpeakingStopped = () => {
      setOrbState('idle');
      setAmplitude(0.05);
      isProcessingRef.current = false;
      triggerAutoListenNextTurn();
    };

    // Wake word detected callback
    engine.onWakeWordDetected = (detectedPhrase) => {
      if (engine.getIsMuted() || isMicMuted || isIncomingCall) return;
      if (engine.getIsSpeaking() || isMicActive || isProcessingRef.current) return;

      console.log('Wake word detected:', detectedPhrase);
      setLastExecutedCommand({
        type: 'OPEN_APP',
        params: { wake_word: detectedPhrase },
        description: `Wake word "${detectedPhrase}" detected! Listening automatically...`,
      });
      startListening();
    };

    if ((settings.wakeWordEnabled || settings.backgroundListeningEnabled) && !isMicMuted && !isIncomingCall) {
      backgroundAudioKeepAlive.start();
      if (settings.wakeWordEnabled) {
        engine.startWakeWordDetection();
      }
    }

    return () => {
      stopListening(true);
      backgroundAudioKeepAlive.stop();
      engine.release();
    };
  }, []);

  // Synchronize microphone mute state with audio engine
  useEffect(() => {
    if (audioEngineRef.current) {
      const muted = isMicMuted || isIncomingCall;
      audioEngineRef.current.setMuted(muted);
      if (muted) {
        autoListenLoopRef.current = false;
        setAmplitude(0);
        if (isMicActive) {
          stopListening(true);
        }
      }
    }
  }, [isMicMuted, isIncomingCall]);

  const restartWakeWordIfAllowed = () => {
    setTimeout(() => {
      if (
        audioEngineRef.current &&
        settings.wakeWordEnabled &&
        !isMicMuted &&
        !isIncomingCall &&
        !isMicActive &&
        !isProcessingRef.current &&
        orbState === 'idle'
      ) {
        audioEngineRef.current.startWakeWordDetection();
      }
    }, 800);
  };

  const stopListening = (cancelOnly = false) => {
    isListeningSessionActiveRef.current = false;
    if (backgroundWatchdogUnregisterRef.current) {
      backgroundWatchdogUnregisterRef.current();
      backgroundWatchdogUnregisterRef.current = null;
    }
    if (!settings.wakeWordEnabled) {
      backgroundAudioKeepAlive.stop();
    }
    if (cancelOnly) {
      autoListenLoopRef.current = false;
      if (autoListenTimeoutRef.current) {
        clearTimeout(autoListenTimeoutRef.current);
        autoListenTimeoutRef.current = null;
      }
    }
    setIsMicActive(false);
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (fallbackRecorderRef.current) {
      try {
        fallbackRecorderRef.current.stop();
      } catch (_e) {}
      fallbackRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
      } catch (_e) {}
      recognitionRef.current = null;
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.stopRecording();
    }
    if (cancelOnly) {
      accumulatedSpeechRef.current = '';
      setLiveTranscript('');
      setInputQuery('');
      setListeningNote('');
      setOrbState('idle');
      setAmplitude(0.05);
    }
  };

  // Commit speech: stops mic and immediately passes query to assistant
  const commitSpeechAndSend = (overrideText?: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const raw = overrideText ?? accumulatedSpeechRef.current;
    const textToSend = deduplicateSpeech(raw).trim();
    stopListening(false);

    if (textToSend) {
      setListeningNote(`आपकी बात सुन ली: "${textToSend}"`);
      handleUserMessage(textToSend);
    } else {
      setOrbState('idle');
      setAmplitude(0.05);
      setListeningNote('');
      restartWakeWordIfAllowed();
    }
  };

  const startListening = async () => {
    startListeningRef.current = startListening;

    // Avoid starting if already speaking or processing
    if (isProcessingRef.current || orbState === 'speaking') {
      return;
    }

    if (isMicMuted || isIncomingCall) {
      setIsMicMuted(false);
    }
    if (!audioEngineRef.current) return;

    // Interrupt any ongoing assistant speech & turn off wake word
    audioEngineRef.current.interrupt();
    audioEngineRef.current.stopWakeWordDetection();
    audioEngineRef.current.stopRecording();

    // Start background keep-alive loop
    if (settings.backgroundListeningEnabled) {
      backgroundAudioKeepAlive.start();
    }

    if (backgroundWatchdogUnregisterRef.current) {
      backgroundWatchdogUnregisterRef.current();
      backgroundWatchdogUnregisterRef.current = null;
    }

    // Mark that listening is now active and in user conversational loop
    autoListenLoopRef.current = true;
    isListeningSessionActiveRef.current = true;
    accumulatedSpeechRef.current = '';
    setLiveTranscript('');
    setListeningNote(
      document.hidden
        ? '🎙️ बैकग्राउंड लिसनिंग चालू... बोलिए'
        : '🎙️ सुन रही हूँ... पूरी बात बोलिए (माइक चालू है)'
    );
    setIsMicActive(true);
    setOrbState('listening');

    // Visual breathing pulse for the Orb while listening
    let pulseVal = 0.25;
    let step = 0.05;
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    pulseTimerRef.current = setInterval(() => {
      pulseVal += step;
      if (pulseVal >= 0.55) step = -0.04;
      if (pulseVal <= 0.20) step = 0.04;
      setAmplitude(pulseVal);
    }, 120);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
          setListeningNote('🎙️ सुन रही हूँ... पूरी बात बोलिए');
        };

        recognition.onspeechstart = () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setListeningNote('🎙️ आपकी आवाज़ सुन रही हूँ... (बोलते रहिए)');
          setAmplitude(0.75);
        };

        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let interim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionFinal += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          const trimmedFinal = sessionFinal.trim();
          const trimmedInterim = interim.trim();

          let rawCombined = '';
          if (trimmedFinal && trimmedInterim) {
            // Guard against Android Web Speech API duplicating interim on top of finalized speech
            if (
              trimmedFinal.toLowerCase().endsWith(trimmedInterim.toLowerCase()) ||
              trimmedFinal.toLowerCase() === trimmedInterim.toLowerCase()
            ) {
              rawCombined = trimmedFinal;
            } else {
              rawCombined = `${trimmedFinal} ${trimmedInterim}`;
            }
          } else {
            rawCombined = trimmedFinal || trimmedInterim;
          }

          // Deduplicate spoken text (prevents double words like "हेलो हेलो" or repeated phrases)
          const fullCombined = deduplicateSpeech(rawCombined);
          if (fullCombined) {
            accumulatedSpeechRef.current = fullCombined;
            setLiveTranscript(fullCombined);
            setInputQuery(fullCombined);
            setAmplitude(0.85);

            // Natural conversational pause: 1800ms gives plenty of time for pauses and breaths
            // so PAYAL listens to the user's entire statement before answering
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                commitSpeechAndSend();
              }
            }, 1800);
          }
        };

        // When speech pauses, wait 1600ms before committing to give user time to complete sentence
        recognition.onspeechend = () => {
          if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                commitSpeechAndSend();
              }
            }, 1600);
          }
        };

        recognition.onerror = async (event: any) => {
          console.warn('SpeechRecognition event/error:', event.error);
          if (event.error === 'no-speech') {
            // DO NOT STOP ON NO-SPEECH: keep listening alive while user pauses
            return;
          }
          // On mobile Android or WebView: 'network', 'audio-capture', 'not-allowed', 'service-not-allowed', 'aborted'
          // Switch automatically and seamlessly to our high-compatibility MediaRecorder + Gemini STT!
          try {
            recognition.abort();
          } catch (_e) {}
          recognitionRef.current = null;
          setListeningNote('🎙️ बैकअप ऑडियो रिकॉर्डर चालू... पूरी बात बोलिए');
          await startFallbackAudioRecorder();
        };

        recognition.onend = () => {
          // If the recognition stopped while user was still in listening mode:
          if (isListeningSessionActiveRef.current && !isProcessingRef.current) {
            if (accumulatedSpeechRef.current.trim()) {
              // Spoken words exist: give a 1400ms pause window before committing
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                if (isListeningSessionActiveRef.current && accumulatedSpeechRef.current.trim()) {
                  commitSpeechAndSend();
                }
              }, 1400);
            } else {
              // Nothing spoken yet: quietly restart so the mic stays ON and doesn't flicker!
              try {
                if (isListeningSessionActiveRef.current) {
                  recognition.start();
                }
              } catch (_e) {}
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, using fallback:', err);
      }
    }

    // Fallback if SpeechRecognition is not supported or threw error
    await startFallbackAudioRecorder();
  };

  const startFallbackAudioRecorder = async () => {
    try {
      setListeningNote('🎙️ सुन रही हूँ... पूरी बात बोलिए (माइक चालू है)');
      setIsMicActive(true);
      setOrbState('listening');

      const recorder = await audioEngineRef.current!.startVoiceRecordingSnippet(
        (amp) => {
          setAmplitude(amp);
        },
        () => {
          // Speech detected by VAD
          setListeningNote('🎙️ आपकी आवाज़ सुन रही हूँ... (बोलते रहिए)');
        },
        () => {
          // Silence detected after speech by VAD - automatically send!
          if (isListeningSessionActiveRef.current && !isProcessingRef.current) {
            handleDoneSpeaking();
          }
        }
      );
      fallbackRecorderRef.current = recorder;
    } catch (err: any) {
      console.error('Audio recorder failed:', err);
      setListeningNote('Microphone access blocked. Check browser permissions or type below.');
      stopListening(true);
      setOrbState('idle');
      setAmplitude(0.05);
    }
  };

  const handleDoneSpeaking = async () => {
    // If fallback recorder was running
    if (fallbackRecorderRef.current) {
      setListeningNote('आपकी बात प्रोसेस हो रही है...');
      setOrbState('thinking');
      const rec = fallbackRecorderRef.current;
      fallbackRecorderRef.current = null;
      try {
        const { base64, mimeType } = await rec.stop();
        if (base64) {
          const res = await fetch('/api/payal/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: base64, mimeType }),
          });
          const data = await res.json();
          if (data.transcript && data.transcript.trim()) {
            stopListening(false);
            handleUserMessage(data.transcript.trim());
            return;
          }
        }
      } catch (err) {
        console.warn('Fallback transcription failed:', err);
      }
    }

    // Immediately commit whatever was accumulated
    commitSpeechAndSend();
  };

  const toggleMic = () => {
    if (orbState === 'speaking') {
      handleInterrupt();
      return;
    }
    if (isMicActive) {
      handleDoneSpeaking();
    } else {
      startListening();
    }
  };

  const executeCommand = (cmd: AppCommand) => {
    setLastExecutedCommand(cmd);

    switch (cmd.type) {
      case 'GROUP_CALL': {
        setActiveApp('phone');
        break;
      }
      case 'GROUP_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'PRIME_CALL': {
        const contactIdx = parseInt(cmd.params.index || '0', 10);
        const contact = settings.primeContacts[contactIdx] || settings.primeContacts[0];
        setActiveApp('phone');
        break;
      }
      case 'PRIME_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'OPEN_APP': {
        const target = (cmd.params.app_name || '').toLowerCase();
        if (target.includes('youtube')) setActiveApp('youtube');
        else if (target.includes('whatsapp')) setActiveApp('whatsapp');
        else setActiveApp('home');
        break;
      }
      case 'CLOSE_APP': {
        setActiveApp('home');
        break;
      }
      case 'WHATSAPP_MSG': {
        setActiveApp('whatsapp');
        break;
      }
      case 'CALL': {
        setActiveApp('phone');
        break;
      }
      case 'VOLUME_UP': {
        setVolume((v) => Math.min(100, v + 15));
        break;
      }
      case 'VOLUME_DOWN': {
        setVolume((v) => Math.max(0, v - 15));
        break;
      }
      case 'FLASHLIGHT_ON': {
        setFlashlightOn(true);
        break;
      }
      case 'FLASHLIGHT_OFF': {
        setFlashlightOn(false);
        break;
      }
      case 'WIFI_ON': {
        setWifiOn(true);
        break;
      }
      case 'WIFI_OFF': {
        setWifiOn(false);
        break;
      }
      case 'BLUETOOTH_ON': {
        setBluetoothOn(true);
        break;
      }
      case 'BLUETOOTH_OFF': {
        setBluetoothOn(false);
        break;
      }
    }

    setTimeout(() => setLastExecutedCommand(null), 4000);
  };

  const handleUserMessage = async (queryText: string) => {
    const cleanText = deduplicateSpeech(queryText).trim();
    if (!cleanText) return;

    // Deduplication check: Prevent repeating the same message twice
    const now = Date.now();
    const lower = cleanText.toLowerCase();
    if (isProcessingRef.current) {
      console.log('Already processing a message, dropping duplicate request');
      return;
    }
    if (
      lastSubmittedTextRef.current === lower &&
      now - lastSubmitTimeRef.current < 3500
    ) {
      console.log('Dropping rapid duplicate submission:', lower);
      return;
    }
    lastSubmittedTextRef.current = lower;
    lastSubmitTimeRef.current = now;
    isProcessingRef.current = true;

    // Stop listening & shut down mic completely while processing and replying
    stopListening();
    setLiveTranscript('');
    setListeningNote('');

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // 2. Parse command (device automation with custom contact groups)
    const detectedCmd = parseVoiceCommand(cleanText, settings.contactGroups);
    if (detectedCmd) {
      executeCommand(detectedCmd);
    }

    // 3. Set visual state to thinking
    setOrbState('thinking');

    try {
      // Send to server Gemini API with safe fallback handling
      let replyText = 'Ji, maine samajh liya!';
      let nativeAudio: string | null = null;
      let sampleRate = 24000;
      const isGeminiStudioVoice = Boolean(settings.voice && settings.voice !== 'IndianGirl20');

      try {
        // Send recent conversation history so PAYAL retains full memory across turns
        const history = messages.slice(-14).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanText,
            history,
            userName: 'Sumit',
            personality: settings.personality,
            voice: settings.voice || 'IndianGirl20',
            wantNativeAudio: isGeminiStudioVoice,
            model: settings.model,
            primeContacts: settings.primeContacts,
            contactGroups: settings.contactGroups,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.text) replyText = removeEmojis(data.text);
            if (data.audio && isGeminiStudioVoice) {
              nativeAudio = data.audio;
              if (data.sampleRate) sampleRate = data.sampleRate;
            }
          }
        }
      } catch (fetchErr) {
        console.warn('Backend chat API reached fallback:', fetchErr);
        if (settings.personality === 'gf') {
          replyText = 'हाँ मेरी जान, मैं हमेशा आपके साथ हूँ! बताइए और क्या करूँ?';
        } else if (settings.personality === 'professional') {
          replyText = 'कमांड प्राप्त हुई। सिस्टम सक्रिय है।';
        } else {
          replyText = 'जी! आपकी कमांड पूरी हो चुकी है।';
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: removeEmojis(replyText),
        timestamp: Date.now(),
        command: detectedCmd || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // 4. Speak response aloud with WebAudioEngine (emojis stripped, mic is strictly OFF while speaking)
      setOrbState('speaking');
      if (audioEngineRef.current) {
        if (nativeAudio && isGeminiStudioVoice) {
          await audioEngineRef.current.playPcmChunk(nativeAudio, sampleRate);
        } else {
          await audioEngineRef.current.speakTextAloud(cleanForSpeech(replyText), settings.voice);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback local response
      let fallbackText = 'जी! आपकी रिक्वेस्ट पूरी हो चुकी है।';
      if (settings.personality === 'gf') {
        fallbackText = 'हाँ मेरी जान, मैं हमेशा तुम्हारे साथ हूँ! बताओ और क्या करूँ?';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          text: removeEmojis(fallbackText),
          timestamp: Date.now(),
          command: detectedCmd || undefined,
        },
      ]);

      setOrbState('speaking');
      if (audioEngineRef.current) {
        await audioEngineRef.current.speakTextAloud(cleanForSpeech(fallbackText));
      }
    } finally {
      isProcessingRef.current = false;
      triggerAutoListenNextTurn();
    }
  };

  const handleInterrupt = () => {
    autoListenLoopRef.current = false;
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.interrupt();
    }
    setOrbState('idle');
    setAmplitude(0.05);
    setListeningNote('बातचीत रोकी गई (Tap orb to speak)');
  };

  const handleSpeakDialogue = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    if (orbState === 'speaking') {
      handleInterrupt();
      return;
    }
    stopListening(true);
    
    const assistantMsg: ChatMessage = {
      id: `spoken-${Date.now()}`,
      role: 'assistant',
      text: textToSpeak,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setOrbState('speaking');
    if (audioEngineRef.current) {
      await audioEngineRef.current.speakTextAloud(textToSpeak, settings.voice);
    }
  };

  const handleLiveVoiceDemo = async () => {
    await handleSpeakDialogue('नमस्ते सुमित जी! मैं आपकी पायल हूँ। देखिए, अब मैं बिल्कुल सजीव वीडियो की तरह आपसे बात कर रही हूँ, पलकें झपका रही हूँ और बात करने के साथ मुस्कुरा रही हूँ! बताइए, आज मैं आपके लिए क्या करूँ?');
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Navigation Bar - Clean, minimal, no confusing options */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-red-500 to-amber-400 shadow-lg shadow-rose-950/50 overflow-hidden flex items-center justify-center">
            <img
              src={getPayalImage()}
              alt="Payal Voice Assistant"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-950 ${
                isMicActive
                  ? 'bg-red-500 animate-ping'
                  : orbState === 'speaking'
                  ? 'bg-rose-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-mono">PAYAL</h1>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded-full font-mono font-medium">
                AI Voice Assistant
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Hindi Voice Assistant (Live Talking)</p>
          </div>
        </div>

        {/* Status Badges & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shadow-red-950/50 cursor-pointer active:scale-95"
            title="पायल एआई का पूरा कोड डाउनलोड या कॉपी करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span>कोड डाउनलोड करें</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
              isBackgrounded
                ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}
            title="Service Worker & Web Audio keep-alive: Tab switch करने पर भी माइक चालू रहता है"
          >
            <Radio className={`w-3.5 h-3.5 ${isMicActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline text-neutral-400">Background:</span>
            <span className={isMicActive ? 'text-emerald-400 font-medium' : 'text-neutral-300 font-medium'}>
              {isBackgrounded ? 'Background Tab' : 'Active'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isMicActive
                  ? 'bg-red-500 animate-ping'
                  : orbState === 'speaking'
                  ? 'bg-rose-400 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-neutral-300 font-medium">
              {isMicActive ? 'Listening...' : orbState === 'speaking' ? 'Speaking...' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6 flex-1">
            {/* Incoming Call Alert Card (High Priority Call Simulation) */}
            {isIncomingCall && (
              <div className="bg-red-950/80 border-2 border-red-600/80 rounded-2xl p-4 shadow-xl shadow-red-950/50 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white animate-bounce shadow-lg shadow-red-600/50">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Incoming Phone Call
                    </div>
                    <div className="text-base font-bold text-white">Mataji / Mom (+91 98765 43210)</div>
                    <div className="text-[11px] text-red-200/80">
                      PAYAL mic auto-muted & speaking paused (CallMonitorService active)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsIncomingCall(false);
                      setActiveApp('phone');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/50 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Accept Call
                  </button>
                  <button
                    onClick={() => {
                      setIsIncomingCall(false);
                      setActiveApp('home');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* Ongoing Device Automation / Call / App Banner */}
            {(activeApp !== 'home' || lastExecutedCommand) && !isIncomingCall && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    {activeApp === 'phone' ? (
                      <span className="text-white font-medium">
                        Outgoing Phone Call Active (Dialing / Connected)
                      </span>
                    ) : activeApp === 'whatsapp' ? (
                      <span className="text-white font-medium">
                        WhatsApp Active (Message sent to recipient)
                      </span>
                    ) : activeApp === 'youtube' ? (
                      <span className="text-white font-medium">
                        YouTube Active (Media player running)
                      </span>
                    ) : lastExecutedCommand ? (
                      <span className="text-neutral-200">
                        Action: <strong className="text-red-400">{lastExecutedCommand.description}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveApp('home');
                    setLastExecutedCommand(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </div>
            )}

            {/* Hero Voice Interaction Console */}
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-sm">
              {/* Central Payal Avatar View - Directly Tap to Open Mic */}
              <div
                className="relative flex flex-col items-center justify-center cursor-pointer group"
                onClick={toggleMic}
                title={
                  orbState === 'speaking'
                    ? 'पायल को रोकें / Tap to Stop'
                    : isMicActive
                    ? 'बोलना पूरा करें और भेजें / Tap to Send'
                    : 'माइक चालू करें / Tap to Speak'
                }
              >
                <div className="relative">
                  <PayalAvatarView
                    state={orbState}
                    amplitude={amplitude}
                    size={280}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white font-medium border border-white/20">
                      {isMicActive ? 'Tap to Send' : 'Tap to Speak'}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <WaveformBarView amplitude={amplitude} width={240} height={36} />
                </div>

                {/* State Badge & Tap Hint */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        orbState === 'listening'
                          ? 'bg-red-500 animate-ping'
                          : orbState === 'speaking'
                          ? 'bg-emerald-400 animate-pulse'
                          : orbState === 'thinking'
                          ? 'bg-amber-400 animate-spin'
                          : 'bg-neutral-500'
                      }`}
                    />
                    <span className="text-neutral-400">Status:</span>
                    <strong
                      className={`font-bold ${
                        orbState === 'listening'
                          ? 'text-red-400'
                          : orbState === 'speaking'
                          ? 'text-emerald-400'
                          : orbState === 'thinking'
                          ? 'text-amber-300'
                          : 'text-neutral-300'
                      }`}
                    >
                      {orbState === 'listening'
                        ? '● LISTENING (आपकी बात सुन रही हूँ...)'
                        : orbState === 'speaking'
                        ? '● SPEAKING (पायल बोल रही हैं...)'
                        : orbState === 'thinking'
                        ? '● THINKING (प्रोसेस हो रहा है...)'
                        : '● READY (तैयार)'}
                    </strong>
                  </div>

                  {/* Primary Mic Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMic();
                    }}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                      isMicActive
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/50 animate-pulse'
                        : orbState === 'speaking'
                        ? 'bg-rose-900/90 hover:bg-rose-800 border border-rose-700 text-rose-200'
                        : orbState === 'thinking'
                        ? 'bg-amber-900/80 border border-amber-700 text-amber-200'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 active:scale-95'
                    }`}
                  >
                    {isMicActive ? (
                      <>
                        <Mic className="w-4 h-4 text-white animate-bounce" />
                        <span>सुन रही हूँ... (बोलना पूरा होने पर टैप करें)</span>
                      </>
                    ) : orbState === 'speaking' ? (
                      <>
                        <Square className="w-4 h-4 fill-current text-rose-300" />
                        <span>पायल को रोकें (Stop)</span>
                      </>
                    ) : orbState === 'thinking' ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>प्रोसेस हो रहा है...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-white" />
                        <span>माइक चालू करें / बोलें (Tap to Speak)</span>
                      </>
                    )}
                  </button>

                  {/* Auto-Mic Continuous Hands-free Loop Indicator & Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !settings.continuousListening;
                      setSettings((prev) => {
                        const updated = { ...prev, continuousListening: next };
                        try {
                          localStorage.setItem('payal_assistant_settings', JSON.stringify(updated));
                        } catch (_e) {}
                        return updated;
                      });
                      autoListenLoopRef.current = next;
                      if (!next && isMicActive) {
                        stopListening(true);
                      }
                    }}
                    className={`mt-1.5 px-3 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      settings.continuousListening
                        ? 'border-red-600/80 bg-red-950/80 text-red-300 shadow-sm shadow-red-950/50'
                        : 'border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-neutral-300'
                    }`}
                    title="ऑटो-माइक टॉगल करें"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        settings.continuousListening ? 'bg-red-400 animate-ping' : 'bg-neutral-600'
                      }`}
                    />
                    <span>
                      {settings.continuousListening
                        ? '🔄 ऑटो-माइक लूप: चालू (बोलने के बाद माइक खुद खुलेगा)'
                        : '🔄 ऑटो-माइक लूप: बंद (मैनुअल मोड)'}
                    </span>
                  </button>
                </div>

                {orbState === 'speaking' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInterrupt();
                    }}
                    className="mt-2 px-3 py-1 rounded-xl bg-red-950/90 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-red-950/60 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" /> Stop / Interrupt Speaking
                  </button>
                )}
              </div>

              {/* Live Real-time Transcription Box */}
              {(isMicActive || liveTranscript || listeningNote) && (
                <div className="w-full max-w-xl mt-5 p-3.5 rounded-2xl bg-neutral-950/80 border border-red-900/40 text-center shadow-lg animate-in fade-in duration-200">
                  <div className="text-[11px] font-mono text-red-400/90 flex items-center justify-center gap-1.5 mb-1">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    <span>{listeningNote || 'Microphone Live:'}</span>
                  </div>
                  <div className="text-sm font-medium text-white min-h-[22px]">
                    {liveTranscript ? (
                      <span className="text-red-300 font-semibold">&ldquo;{liveTranscript}&rdquo;</span>
                    ) : (
                      <span className="text-neutral-500 italic">Abhi boliye... Aapki aawaz direct suni ja rahi hai</span>
                    )}
                  </div>
                  {isMicActive && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={handleDoneSpeaking}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>बोल लिया? भेजें (Send)</span>
                      </button>
                      <button
                        onClick={() => stopListening(true)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>रद्द करें</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat & Automation History Log */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-4 md:p-6 flex flex-col gap-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-red-400" /> Conversation & Activity Log
                </span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  {messages.length} message{messages.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl text-xs font-mono">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
                      }`}
                    >
                      <div className="font-sans leading-relaxed">{m.text}</div>
                      {m.command && (
                        <div className="mt-2 pt-1.5 border-t border-neutral-800 text-[10px] text-red-300 flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>Action: {m.command.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Query Input Box */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    isMicActive
                      ? 'bg-red-600 text-white ring-2 ring-red-500/50 animate-pulse'
                      : orbState === 'speaking'
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                  title={
                    orbState === 'speaking'
                      ? 'पायल को रोकें / Tap to Stop'
                      : isMicActive
                      ? 'बोलना पूरा करें और भेजें / Send'
                      : 'माइक चालू करें / Speak'
                  }
                >
                  {orbState === 'speaking' ? (
                    <Square className="w-4 h-4 fill-current text-rose-300" />
                  ) : isMicActive ? (
                    <Mic className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-neutral-400" />
                  )}
                </button>

                <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus-within:border-red-500 transition-colors">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUserMessage(inputQuery);
                    }}
                    placeholder={
                      isMicActive
                        ? 'Sun rahi hoon... Boliye...'
                        : "माइक दबाकर बोलें या टाइप करें (e.g. 'YouTube kholo')..."
                    }
                    className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                  />
                  {isMicActive ? (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={handleDoneSpeaking}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="भेजें / Send"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                      <button
                        onClick={() => stopListening(true)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="रद्द करें / Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUserMessage(inputQuery)}
                      disabled={!inputQuery.trim()}
                      className="p-1 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors shrink-0 cursor-pointer"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
      </main>

      {/* Code Export & Download Modal */}
      <CodeExportModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />
    </div>
  );
}

export default App;
```

---

## <a id="src-android-payalbackgroundvoiceservice-kt"></a>📁 `src/android/PayalBackgroundVoiceService.kt`
**विवरण:** 24x7 बैकग्राउंड वॉइस सर्विस (स्क्रीन बंद होने पर भी 'पायल' सुनकर तुरंत एक्टिव होना)

```kotlin
package com.payal.assistant.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.core.app.NotificationCompat
import com.payal.assistant.ui.main.MainActivity
import kotlinx.coroutines.*
import java.util.Locale
import kotlin.math.sqrt

/**
 * 24x7 Native Background Voice Service for PAYAL AI
 * 
 * Features:
 * 1. Continuous Foreground Microphone capture with FOREGROUND_SERVICE_MICROPHONE
 * 2. Real-time Wake Word Detection ("पायल", "Payal", "हे पायल", "सुनो पायल")
 * 3. Keeps CPU active via PARTIAL_WAKE_LOCK even when device screen is turned OFF
 * 4. Haptic vibration feedback & instant voice wake-up
 * 5. Screen WakeUp: Wakes up phone screen upon hearing "पायल"
 * 6. Launches Floating Orb or MainActivity to seamlessly answer user questions
 * 7. START_STICKY with automatic resurrection on low memory or device reboot
 */
class PayalBackgroundVoiceService : Service(), TextToSpeech.OnInitListener {

    companion object {
        private const val TAG = "PayalBackgroundService"
        const val CHANNEL_ID = "payal_background_voice_channel"
        const val NOTIFICATION_ID = 5005

        const val ACTION_START_LISTENING = "com.payal.START_BACKGROUND_LISTENING"
        const val ACTION_STOP_LISTENING = "com.payal.STOP_BACKGROUND_LISTENING"

        private const val SAMPLE_RATE = 16000
        private const val CHUNK_SIZE = 1024
        private const val VAD_ENERGY_THRESHOLD = 0.045f // RMS speech threshold
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var listeningJob: Job? = null

    private var audioRecord: AudioRecord? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var vibrator: Vibrator? = null

    @Volatile private var isRunning = false
    @Volatile private var isRecognizing = false

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Payal Background Voice Service Created")

        createNotificationChannel()
        acquireWakeLock()
        initTextToSpeech()
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_LISTENING -> {
                stopListening()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                startForeground(NOTIFICATION_ID, buildForegroundNotification())
                startContinuousListening()
                return START_STICKY
            }
        }
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "PayalAssistant:BackgroundVoiceWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire(24 * 60 * 60 * 1000L) // 24 hours lock
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire WakeLock: \${e.message}")
        }
    }

    private fun initTextToSpeech() {
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.ENGLISH)
            }
        }
    }

    /**
     * Continuous background audio capture loop for wake word detection
     */
    @SuppressLint("MissingPermission")
    private fun startContinuousListening() {
        if (isRunning) return
        isRunning = true

        val minBufSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        val bufferSize = maxOf(minBufSize, CHUNK_SIZE * 4)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            audioRecord?.startRecording()

            listeningJob = serviceScope.launch {
                val buffer = ByteArray(CHUNK_SIZE)
                var consecutiveSpeechFrames = 0

                while (isActive && isRunning) {
                    if (isRecognizing) {
                        delay(200)
                        continue
                    }

                    val read = audioRecord?.read(buffer, 0, CHUNK_SIZE) ?: 0
                    if (read > 0) {
                        val rms = calculateRms(buffer, read)
                        
                        // Voice activity detected in background
                        if (rms > VAD_ENERGY_THRESHOLD) {
                            consecutiveSpeechFrames++
                            if (consecutiveSpeechFrames >= 3) {
                                consecutiveSpeechFrames = 0
                                onPotentialWakeWordDetected()
                            }
                        } else {
                            consecutiveSpeechFrames = 0
                        }
                    }
                    delay(25)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting AudioRecord: \${e.message}")
        }
    }

    /**
     * Triggered when speech energy is detected in background.
     * Starts lightweight Android SpeechRecognizer to check if user said "Payal" / "पायल"
     */
    private fun onPotentialWakeWordDetected() {
        if (isRecognizing) return
        isRecognizing = true

        serviceScope.launch(Dispatchers.Main) {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this@PayalBackgroundVoiceService)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1500L)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onResults(results: android.os.Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val spoken = matches?.joinToString(" ")?.lowercase(Locale.ROOT) ?: ""
                        checkWakeWordAndRespond(spoken)
                        isRecognizing = false
                    }

                    override fun onPartialResults(partialResults: android.os.Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val partial = matches?.firstOrNull()?.lowercase(Locale.ROOT) ?: ""
                        if (containsPayalWakeWord(partial)) {
                            speechRecognizer?.stopListening()
                            checkWakeWordAndRespond(partial)
                            isRecognizing = false
                        }
                    }

                    override fun onError(error: Int) {
                        isRecognizing = false
                    }

                    override fun onReadyForSpeech(params: android.os.Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}
                    override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
                })

                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                isRecognizing = false
            }
        }
    }

    private fun containsPayalWakeWord(text: String): Boolean {
        val clean = text.lowercase(Locale.ROOT).trim()
        val keywords = listOf(
            "payal", "पायल", "hey payal", "हे पायल",
            "hello payal", "हेलो पायल", "suno payal", "सुनो पायल",
            "batao payal", "payal suno"
        )
        return keywords.any { clean.contains(it) }
    }

    /**
     * Wakes up the device and executes response when wake word is confirmed
     */
    private fun checkWakeWordAndRespond(speechText: String) {
        if (containsPayalWakeWord(speechText)) {
            Log.i(TAG, "Wake Word 'PAYAL' detected in background! Text: $speechText")

            // 1. Haptic Feedback (Double pulse vibration)
            triggerHapticFeedback()

            // 2. Wake Screen if locked / off
            wakeUpScreen()

            // 3. Spoken Response from Payal
            speakConfirmation()

            // 4. Launch Main App / Floating Overlay
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("WAKE_WORD_TRIGGERED", true)
                putExtra("USER_SPEECH_QUERY", speechText)
            }
            startActivity(launchIntent)
        }
    }

    private fun triggerHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    VibrationEffect.createWaveform(longArrayOf(0, 120, 80, 180), -1)
                )
            } else {
                vibrator?.vibrate(250)
            }
        } catch (_: Exception) {}
    }

    private fun wakeUpScreen() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val screenWakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "PayalAssistant:ScreenWakeLock"
            )
            screenWakeLock.acquire(4000L)
        } catch (_: Exception) {}
    }

    private fun speakConfirmation() {
        val greetings = listOf(
            "हाँ जी, मैं सुन रही हूँ!",
            "हाँ बोलिए, क्या मदद करूँ?",
            "पायल हाज़िर है, आदेश दीजिए!"
        )
        val selected = greetings.random()
        tts?.speak(selected, TextToSpeech.QUEUE_FLUSH, null, "PAYAL_WAKE_RESPONSE")
    }

    private fun calculateRms(pcm: ByteArray, length: Int): Float {
        var sum = 0.0
        var count = 0
        for (i in 0 until length - 1 step 2) {
            val sample = (pcm[i].toInt() and 0xFF) or (pcm[i + 1].toInt() shl 8)
            val normalized = sample.toShort().toFloat() / 32768.0f
            sum += (normalized * normalized)
            count++
        }
        if (count == 0) return 0f
        return sqrt(sum / count).toFloat().coerceIn(0f, 1f)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PAYAL Background Voice Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps PAYAL listening for 'पायल' wake word in the background 24x7"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("पायल एआई बैकग्राउंड में सक्रिय है")
            .setContentText("कभी भी 'पायल' बोलें, मैं तुरंत सुनूँगी 🎙️")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun stopListening() {
        isRunning = false
        listeningJob?.cancel()
        listeningJob = null

        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (_: Exception) {}

        try {
            wakeLock?.release()
            wakeLock = null
        } catch (_: Exception) {}

        speechRecognizer?.destroy()
        speechRecognizer = null
    }

    override fun onDestroy() {
        stopListening()
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
        Log.i(TAG, "Payal Background Voice Service Destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
```

---

## <a id="src-android-permissionmanager-kt"></a>📁 `src/android/PermissionManager.kt`
**विवरण:** ऑटोमैटिक परमिशन मैनेजर व बैटरी ऑप्टिमाइज़ेशन बाईपास (Doze Mode बाईपास)

```kotlin
package com.payal.assistant.util

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * All-In-One Automatic Permission Manager for PAYAL AI Voice Assistant
 * Automatically checks, requests, and self-grants all system permissions:
 * - 24x7 Background Microphone & Audio Recording
 * - Battery Optimization Exemption (Prevents Android from killing Payal in background)
 * - Draw Over Other Apps / Floating Screen Overlay
 * - Phone Calling, Auto-Call Answering, SMS, and Contacts
 * - Boot Receiver & Device Automation
 */
class PermissionManager(private val context: Context) {

    companion object {
        const val RC_ALL_PERMISSIONS = 9999
        const val RC_OVERLAY_PERMISSION = 9998
        const val RC_BATTERY_OPTIMIZATION = 9997

        val REQUIRED_RUNTIME_PERMISSIONS = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        ).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                add(Manifest.permission.ANSWER_PHONE_CALLS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }

    /**
     * Checks if all runtime permissions are granted
     */
    fun hasAllRuntimePermissions(): Boolean {
        return REQUIRED_RUNTIME_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Returns list of permissions that still need to be requested
     */
    fun getMissingRuntimePermissions(): List<String> {
        return REQUIRED_RUNTIME_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Automatically requests all missing runtime permissions at once
     */
    fun requestMissingPermissions(activity: Activity) {
        val missing = getMissingRuntimePermissions()
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(activity, missing.toTypedArray(), RC_ALL_PERMISSIONS)
        }
    }

    /**
     * Checks if app is exempt from Battery Optimizations (Doze Mode).
     * This is critical so Android never kills Payal's background voice listener.
     */
    fun isBatteryOptimizationIgnored(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            pm.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true
        }
    }

    /**
     * Prompts the user to exempt Payal from Battery Optimizations
     */
    @SuppressLint("BatteryLife")
    fun requestIgnoreBatteryOptimization(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isBatteryOptimizationIgnored()) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:\${context.packageName}")
                }
                activity.startActivityForResult(intent, RC_BATTERY_OPTIMIZATION)
            } catch (e: Exception) {
                // Fallback to standard battery settings
                try {
                    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    activity.startActivity(intent)
                } catch (_: Exception) {}
            }
        }
    }

    /**
     * Checks if Draw Over Other Apps (SYSTEM_ALERT_WINDOW) is granted
     */
    fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    /**
     * Prompts the user to grant Floating Overlay permission
     */
    fun requestOverlayPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !canDrawOverlays()) {
            try {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\${context.packageName}")
                )
                activity.startActivityForResult(intent, RC_OVERLAY_PERMISSION)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Auto-runs complete permission setup check in one shot on app startup:
     * 1. Requests missing runtime permissions (Audio, Phone, SMS, Contacts)
     * 2. Requests Battery Optimization exemption (for 24x7 background listening)
     * 3. Requests Overlay permission (for floating assistant orb)
     */
    fun autoSetupAllPermissions(activity: Activity) {
        if (!hasAllRuntimePermissions()) {
            requestMissingPermissions(activity)
            return
        }

        if (!isBatteryOptimizationIgnored()) {
            requestIgnoreBatteryOptimization(activity)
            return
        }

        if (!canDrawOverlays()) {
            requestOverlayPermission(activity)
        }
    }
}
```

---

## <a id="src-android-bootreceiver-kt"></a>📁 `src/android/BootReceiver.kt`
**विवरण:** फ़ोन स्विच ऑन / रीबूट होते ही पायल सर्विस अपने आप शुरू करना

```kotlin
package com.payal.assistant.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Boot Receiver for PAYAL AI
 * 
 * Automatically triggers upon:
 * - Intent.ACTION_BOOT_COMPLETED (Phone rebooted / switched on)
 * - "android.intent.action.QUICKBOOT_POWERON" (Fast boot)
 * - Intent.ACTION_MY_PACKAGE_REPLACED (App updated)
 * 
 * Launches PayalBackgroundVoiceService so PAYAL is always ready and listening
 * for "पायल" without having to manually open the app!
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PayalBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i(TAG, "BootReceiver received action: \$action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            // 1. Start 24x7 Background Voice Service
            val voiceServiceIntent = Intent(context, PayalBackgroundVoiceService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(voiceServiceIntent)
            } else {
                context.startService(voiceServiceIntent)
            }
            Log.i(TAG, "Successfully auto-started PayalBackgroundVoiceService on device boot!")

            // 2. Start Call Monitor Service
            val callServiceIntent = Intent(context, CallMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(callServiceIntent)
            } else {
                context.startService(callServiceIntent)
            }
            Log.i(TAG, "Successfully auto-started CallMonitorService on device boot!")
        }
    }
}
```

---

## <a id="src-android-androidmanifest-xml"></a>📁 `src/android/AndroidManifest.xml`
**विवरण:** बैकग्राउंड माइक, वेकलॉक, ऑटो परमिशन व सर्विस मेनिफेस्ट

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.payal.assistant">

    <!-- 1. Microphone & Background Audio Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- 2. Foreground Services (Android 9 to Android 14+) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- 3. Battery & Background Survival Permissions -->
    <!-- Essential for keeping Payal listening when phone screen is turned off -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- 4. Floating Overlay & Window Management -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 5. Phone Calls & Auto-Answering Permissions -->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.SEND_SMS" />

    <!-- 6. Hardware, Flashlight & Connectivity -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Payal">

        <!-- Main Voice Assistant Activity -->
        <activity
            android:name=".ui.main.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Settings Activity -->
        <activity
            android:name=".ui.settings.SettingsActivity"
            android:exported="false"
            android:screenOrientation="portrait" />

        <!-- 24x7 Background Voice Service (Listens for 'पायल') -->
        <service
            android:name=".service.PayalBackgroundVoiceService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone"
            android:stopWithTask="false" />

        <!-- Floating Screen Orb Service -->
        <service
            android:name=".service.PayalOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <!-- Incoming Call Protection Service -->
        <service
            android:name=".service.CallMonitorService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="phoneCall" />

        <!-- Accessibility Service for automated phone actions & closing apps -->
        <service
            android:name=".service.AccessibilityHelperService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Hardware Double Power Button Trigger Receiver -->
        <receiver
            android:name=".service.PowerButtonReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.SCREEN_OFF" />
                <action android:name="android.intent.action.SCREEN_ON" />
            </intent-filter>
        </receiver>

        <!-- Auto-Start Receiver on Phone Boot / Reboot -->
        <receiver
            android:name=".service.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>
```

---

## <a id="src-utils-audioengine-ts"></a>📁 `src/utils/audioEngine.ts`
**विवरण:** WebAudio, VAD (वॉइस डिटेक्शन) व माइक रिकॉर्डिंग

```typescript
/**
 * Client Audio Engine for PAYAL
 * Mirrors AudioEngine.kt with Web Audio API:
 * - 16kHz microphone capture & RMS calculation
 * - 24kHz speaker playback
 * - Echo suppression while speaking
 * - Interrupt support
 * - SpeechRecognition integration
 */

import { cleanForSpeech, removeEmojis, convertHinglishToDevanagari } from './textCleaner';
import { backgroundAudioKeepAlive } from './backgroundAudioKeepAlive';

export class WebAudioEngine {
  private micContext: AudioContext | null = null;
  private speakerContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private unregisterRmsWatchdog: (() => void) | null = null;
  private wakeWordUnregisterWatchdog: (() => void) | null = null;

  private isSpeaking = false;
  private isMuted = false;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  private speakerAnalyser: AnalyserNode | null = null;
  private speakerAnimFrameId: number | null = null;
  private speechSimInterval: any = null;

  // Wake word engine state
  private wakeWord = 'Hey PAYAL';
  private wakeWordEnabled = true;
  private wakeWordRecognition: any = null;
  private isListeningForWakeWord = false;
  private wakeWordCooldown = false;
  private wakeWordRestartTimeout: any = null;

  public onAmplitudeChanged?: (rms: Float32Array | number) => void;
  public onSpeakingStarted?: () => void;
  public onSpeakingStopped?: () => void;
  public onWakeWordDetected?: (detectedWord: string) => void;

  /**
   * Start microphone recording and live RMS calculation
   */
  async startRecording(): Promise<boolean> {
    try {
      if (this.micStream) return true;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.micContext = new AudioCtx({ sampleRate: 16000 });
      backgroundAudioKeepAlive.registerAudioContext(this.micContext);

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.micContext.createMediaStreamSource(this.micStream);
      this.analyser = this.micContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const pcmData = new Uint8Array(this.analyser.frequencyBinCount);

      const computeRms = () => {
        if (!this.analyser) return;

        if (this.isSpeaking || this.isMuted) {
          // Suppress mic processing while PAYAL speaks or when muted
          this.onAmplitudeChanged?.(0);
        } else {
          this.analyser.getByteTimeDomainData(pcmData);
          // Calculate RMS
          let sumSquares = 0;
          for (let i = 0; i < pcmData.length; i++) {
            const normalized = (pcmData[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / pcmData.length);
          // Boost sensitivity for user speech
          const amplifiedRms = Math.min(1.0, rms * 3.2);
          this.onAmplitudeChanged?.(amplifiedRms);
        }
      };

      const loop = () => {
        if (!this.analyser) return;
        computeRms();
        this.animFrameId = requestAnimationFrame(loop);
      };

      loop();

      // Register background watchdog: when tab is hidden or in background,
      // the unthrottled Web Worker heartbeat will continue invoking computeRms()!
      if (this.unregisterRmsWatchdog) {
        this.unregisterRmsWatchdog();
      }
      this.unregisterRmsWatchdog = backgroundAudioKeepAlive.registerWatchdog(() => {
        if (document.hidden && this.analyser) {
          computeRms();
        }
      });

      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
      return false;
    }
  }

  /**
   * Stop microphone recording and release hardware audio capture
   * Crucial for Android to prevent "Chrome is recording" system locks
   */
  stopRecording(): void {
    if (this.unregisterRmsWatchdog) {
      this.unregisterRmsWatchdog();
      this.unregisterRmsWatchdog = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_e) {}
      });
      this.micStream = null;
    }
    if (this.micContext && this.micContext.state !== 'closed') {
      try {
        backgroundAudioKeepAlive.unregisterAudioContext(this.micContext);
        this.micContext.close();
      } catch (_e) {}
      this.micContext = null;
    }
    this.analyser = null;
    this.onAmplitudeChanged?.(0);
  }

  /**
   * Play base64 24kHz PCM audio chunk from Gemini Aoede voice model
   * Resolves when audio playback finishes completely
   */
  playPcmChunk(base64Pcm: string, sampleRate = 24000): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        const binaryString = atob(base64Pcm);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 16-bit PCM little-endian to float32
        const numSamples = Math.floor(bytes.length / 2);
        const float32Data = new Float32Array(numSamples);
        const dataView = new DataView(bytes.buffer);

        for (let i = 0; i < numSamples; i++) {
          const int16 = dataView.getInt16(i * 2, true);
          float32Data[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.speakerContext || this.speakerContext.state === 'closed') {
          this.speakerContext = new AudioCtx({ sampleRate });
          backgroundAudioKeepAlive.registerAudioContext(this.speakerContext);
        }

        const proceed = () => {
          if (!this.speakerContext) {
            resolve();
            return;
          }

          const audioBuffer = this.speakerContext.createBuffer(1, numSamples, sampleRate);
          audioBuffer.getChannelData(0).set(float32Data);

          const sourceNode = this.speakerContext.createBufferSource();
          sourceNode.buffer = audioBuffer;

          // Connect through speakerAnalyser for real-time visualizer pulsing during Aoede speech
          if (!this.speakerAnalyser) {
            this.speakerAnalyser = this.speakerContext.createAnalyser();
            this.speakerAnalyser.fftSize = 256;
            this.speakerAnalyser.connect(this.speakerContext.destination);
          }
          sourceNode.connect(this.speakerAnalyser);

          const now = this.speakerContext.currentTime;
          const startTime = Math.max(now, this.nextPlayTime);
          sourceNode.start(startTime);
          this.nextPlayTime = startTime + audioBuffer.duration;

          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.onSpeakingStarted?.();
            this.startSpeakerVisualizerLoop();
          }

          this.activeSourceNodes.push(sourceNode);

          let ended = false;
          const onDone = () => {
            if (ended) return;
            ended = true;
            const idx = this.activeSourceNodes.indexOf(sourceNode);
            if (idx !== -1) this.activeSourceNodes.splice(idx, 1);

            if (this.activeSourceNodes.length === 0) {
              this.stopSpeakerVisualizerLoop();
              this.isSpeaking = false;
              this.onSpeakingStopped?.();
              this.nextPlayTime = 0;
              this.onAmplitudeChanged?.(0);
            }
            resolve();
          };

          sourceNode.onended = onDone;
          // Safety timeout in case onended is dropped by browser
          setTimeout(onDone, Math.ceil(audioBuffer.duration * 1000) + 400);
        };

        if (this.speakerContext.state === 'suspended') {
          this.speakerContext.resume().then(proceed).catch(() => proceed());
        } else {
          proceed();
        }
      } catch (e) {
        console.error('Error playing PCM audio chunk:', e);
        this.stopSpeakerVisualizerLoop();
        this.isSpeaking = false;
        this.onSpeakingStopped?.();
        resolve();
      }
    });
  }

  private startSpeakerVisualizerLoop(): void {
    if (this.speakerAnimFrameId) return;
    const pcmData = new Uint8Array(128);
    const loop = () => {
      if (!this.speakerAnalyser || !this.isSpeaking) {
        this.speakerAnimFrameId = null;
        return;
      }
      this.speakerAnalyser.getByteTimeDomainData(pcmData);
      let sumSquares = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const val = (pcmData[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / pcmData.length);
      this.onAmplitudeChanged?.(Math.min(1, rms * 3.8));
      this.speakerAnimFrameId = requestAnimationFrame(loop);
    };
    this.speakerAnimFrameId = requestAnimationFrame(loop);
  }

  private stopSpeakerVisualizerLoop(): void {
    if (this.speakerAnimFrameId) {
      cancelAnimationFrame(this.speakerAnimFrameId);
      this.speakerAnimFrameId = null;
    }
  }

  /**
   * Selects the highest quality Indian female voice available on the device
   * Supports Android Google Hindi TTS, Windows Microsoft Swara/Kalpana, iOS Lekha,
   * and fallback Indian English female voices.
   */
  private pickIndianFemaleVoice(
    voices: SpeechSynthesisVoice[],
    preferredName?: string
  ): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    if (preferredName) {
      const match = voices.find((v) =>
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (match) return match;
    }

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      let score = 0;

      // Heavy penalty for male voices so assistant is always female
      if (
        name.includes('male') ||
        name.includes('david') ||
        name.includes('george') ||
        name.includes('mark') ||
        name.includes('ravi') ||
        name.includes('prabhat') ||
        name.includes('madhav')
      ) {
        score -= 100;
      }

      // Strong bonus for Hindi language
      if (lang === 'hi-in' || lang.startsWith('hi')) {
        score += 80;
      } else if (lang === 'en-in') {
        score += 30;
      }

      // Top priority: Authentic Indian Hindi female voice identifiers
      // Google TTS: 'Google हिन्दी', 'hi-in-x-hie-local', 'hi-in-x-hie-network', 'hi-in-x-cfh-local'
      // Windows: 'Swara', 'Kalpana'
      // Apple: 'Lekha'
      if (
        name.includes('swara') ||
        name.includes('lekha') ||
        name.includes('kalpana') ||
        name.includes('हिन्दी') ||
        name.includes('hindi') ||
        name.includes('hie') ||
        name.includes('cfh')
      ) {
        score += 70;
      } else if (
        name.includes('neerja') ||
        name.includes('kavya') ||
        name.includes('heera') ||
        name.includes('priya')
      ) {
        score += 40;
      } else if (
        name.includes('female') ||
        name.includes('woman') ||
        name.includes('girl') ||
        name.includes('natural')
      ) {
        score += 25;
      }

      return score;
    };

    const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sorted[0] && scoreVoice(sorted[0]) > 0 ? sorted[0] : null;
  }

  /**
   * Browser Web Speech API for speaking text aloud with an authentic, sweet 20-year-old Indian girl voice
   */
  speakTextAloud(text: string, voiceName?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      if (this.speechSimInterval) {
        clearInterval(this.speechSimInterval);
        this.speechSimInterval = null;
      }

      // Clean text for speech - strip all markdown symbols and all emojis so TTS never speaks emoji names
      let cleanText = cleanForSpeech(text).trim();
      // Crucial: Convert any Roman Hinglish ("Hello mere pyaare Sumit") to Devanagari Hindi
      // so the Indian TTS engine pronounces it in pure, melodious Indian girl voice instead of robotic English phonetics!
      cleanText = convertHinglishToDevanagari(cleanText);

      if (!cleanText) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Explicitly set language tag to Hindi (India)
      utterance.lang = 'hi-IN';

      // Select authentic Indian female voice (Google हिन्दी, Swara, Kalpana, Lekha)
      const voices = window.speechSynthesis.getVoices();
      const actualVoiceName = voiceName === 'IndianGirl20' ? undefined : voiceName;
      const bestIndianVoice = this.pickIndianFemaleVoice(voices, actualVoiceName);

      if (bestIndianVoice) {
        utterance.voice = bestIndianVoice;
        if (bestIndianVoice.lang) utterance.lang = bestIndianVoice.lang;
      }

      // Pitch: 1.28 gives a youthful, lively, cute 20-year-old Indian girl tone (standard adult is 1.0)
      // Rate: 1.02 delivers sweet, natural, energetic conversational pacing
      utterance.pitch = 1.28;
      utterance.rate = 1.02;

      let hasEnded = false;
      const finishSpeaking = () => {
        if (hasEnded) return;
        hasEnded = true;
        if (this.speechSimInterval) {
          clearInterval(this.speechSimInterval);
          this.speechSimInterval = null;
        }
        this.isSpeaking = false;
        this.onSpeakingStopped?.();
        this.onAmplitudeChanged?.(0);
        resolve();
      };

      const startTime = Date.now();
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.onSpeakingStarted?.();
        // Dynamic waveform pulsing while the 20-year-old Indian girl speaks
        if (this.speechSimInterval) clearInterval(this.speechSimInterval);
        this.speechSimInterval = setInterval(() => {
          if (!this.isSpeaking) {
            if (this.speechSimInterval) clearInterval(this.speechSimInterval);
            this.speechSimInterval = null;
            return;
          }
          const elapsed = (Date.now() - startTime) / 1000;
          // Syllabic envelope modulation (vowels and pauses 6-8Hz)
          const syllabicCadence = (Math.sin(elapsed * 16) + Math.sin(elapsed * 9.5) + 1.8) / 3.8;
          const jitter = 0.6 + Math.random() * 0.4;
          const rms = Math.min(1.0, Math.max(0.15, syllabicCadence * jitter));
          this.onAmplitudeChanged?.(rms);
        }, 35);
      };

      utterance.onend = () => {
        finishSpeaking();
      };

      utterance.onerror = () => {
        finishSpeaking();
      };

      // Safety timeout: on Android Chrome, speech synthesis occasionally drops the onend event
      const maxDuration = Math.max(4000, (cleanText.length / 10) * 1000 + 3000);
      setTimeout(finishSpeaking, maxDuration);

      // Micro-delay avoids race condition with cancel() on WebKit / Android Chrome
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (_err) {
          finishSpeaking();
        }
      }, 20);
    });
  }

  /**
   * Interrupt PAYAL speaking immediately
   */
  interrupt(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.speechSimInterval) {
      clearInterval(this.speechSimInterval);
      this.speechSimInterval = null;
    }

    for (const node of this.activeSourceNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch (_e) {}
    }
    this.activeSourceNodes = [];
    this.nextPlayTime = 0;
    this.stopSpeakerVisualizerLoop();
    this.isSpeaking = false;
    this.onSpeakingStopped?.();
    this.onAmplitudeChanged?.(0);
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.onAmplitudeChanged?.(0);
    }
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  setWakeWord(word: string): void {
    if (word && word.trim()) {
      this.wakeWord = word.trim();
    }
  }

  getWakeWord(): string {
    return this.wakeWord;
  }

  setWakeWordEnabled(enabled: boolean): void {
    this.wakeWordEnabled = enabled;
    if (!enabled) {
      this.stopWakeWordDetection();
    } else {
      this.startWakeWordDetection();
    }
  }

  /**
   * Start listening for the wake word continuously in the background
   * Respects microphone mute state and speaking state
   */
  startWakeWordDetection(): void {
    if (!this.wakeWordEnabled) return;
    if (this.isListeningForWakeWord) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (!this.wakeWordRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          if (this.isMuted || this.isSpeaking || this.wakeWordCooldown || !this.wakeWordEnabled) {
            return;
          }

          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }

          const cleanTranscript = currentTranscript.toLowerCase().replace(/[.,!?;:]/g, '').trim();
          const targetWake = this.wakeWord.toLowerCase().replace(/[.,!?;:]/g, '').trim();

          const matches =
            cleanTranscript.includes(targetWake) ||
            cleanTranscript.includes('payal') ||
            cleanTranscript.includes('पायल') ||
            cleanTranscript.includes('हे पायल') ||
            cleanTranscript.includes('सुनो पायल') ||
            cleanTranscript.includes('फाइल') ||
            cleanTranscript.includes('hey payal') ||
            cleanTranscript.includes('suno payal') ||
            cleanTranscript.includes('hi payal') ||
            cleanTranscript.includes('hello payal') ||
            cleanTranscript.includes('ok payal');

          if (matches) {
            this.wakeWordCooldown = true;
            setTimeout(() => {
              this.wakeWordCooldown = false;
            }, 2500);

            this.onWakeWordDetected?.(this.wakeWord);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.debug('Wake word recognition note:', event.error);
          }
        };

        recognition.onend = () => {
          if (
            this.isListeningForWakeWord &&
            this.wakeWordEnabled &&
            !this.isMuted &&
            !this.isSpeaking
          ) {
            if (this.wakeWordRestartTimeout) clearTimeout(this.wakeWordRestartTimeout);
            this.wakeWordRestartTimeout = setTimeout(() => {
              try {
                if (
                  this.isListeningForWakeWord &&
                  this.wakeWordEnabled &&
                  this.wakeWordRecognition &&
                  !this.isMuted &&
                  !this.isSpeaking
                ) {
                  this.wakeWordRecognition.start();
                }
              } catch (_e) {}
            }, 1000);
          }
        };

        this.wakeWordRecognition = recognition;
      }

      this.isListeningForWakeWord = true;
      try {
        this.wakeWordRecognition.start();
      } catch (_e) {}
    } catch (e) {
      console.warn('Could not start wake word recognition:', e);
    }
  }

  stopWakeWordDetection(): void {
    this.isListeningForWakeWord = false;
    if (this.wakeWordUnregisterWatchdog) {
      this.wakeWordUnregisterWatchdog();
      this.wakeWordUnregisterWatchdog = null;
    }
    if (this.wakeWordRestartTimeout) {
      clearTimeout(this.wakeWordRestartTimeout);
      this.wakeWordRestartTimeout = null;
    }
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.onend = null;
        this.wakeWordRecognition.onerror = null;
        this.wakeWordRecognition.onresult = null;
        if (typeof this.wakeWordRecognition.abort === 'function') {
          this.wakeWordRecognition.abort();
        } else {
          this.wakeWordRecognition.stop();
        }
      } catch (_e) {}
      this.wakeWordRecognition = null;
    }
  }

  /**
   * Records a user voice snippet via MediaRecorder for fallback STT transcription
   * Supports real-time RMS monitoring and Voice Activity Detection (VAD) with auto-silence detection
   */
  async startVoiceRecordingSnippet(
    onAmplitude?: (amp: number) => void,
    onSpeechDetected?: () => void,
    onSilenceDetected?: () => void
  ): Promise<{ stop: () => Promise<{ base64: string; mimeType: string }> }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const pcmData = new Uint8Array(analyser.frequencyBinCount);
    let animId: number | null = null;
    let hasSpoken = false;
    let silenceTimer: any = null;

    const measureLoop = () => {
      analyser.getByteTimeDomainData(pcmData);
      let sum = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const val = (pcmData[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / pcmData.length);
      const scaledAmp = Math.min(1.0, rms * 4.0);
      onAmplitude?.(scaledAmp);

      // Simple real-time Voice Activity Detection (VAD)
      if (rms > 0.035) {
        if (!hasSpoken) {
          hasSpoken = true;
          onSpeechDetected?.();
        }
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
      } else if (hasSpoken) {
        if (!silenceTimer) {
          silenceTimer = setTimeout(() => {
            onSilenceDetected?.();
          }, 1600);
        }
      }

      animId = requestAnimationFrame(measureLoop);
    };
    measureLoop();

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start(100);

    return {
      stop: () =>
        new Promise((resolve) => {
          if (animId) cancelAnimationFrame(animId);
          onAmplitude?.(0);

          mediaRecorder.onstop = () => {
            // Clean up audio tracks & context
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (_e) {}
            });
            try {
              ctx.close();
            } catch (_e) {}

            const blob = new Blob(chunks, { type: mimeType });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64 = (reader.result as string) || '';
              resolve({ base64, mimeType });
            };
          };

          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          } else {
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (_e) {}
            });
            try {
              ctx.close();
            } catch (_e) {}
            resolve({ base64: '', mimeType });
          }
        }),
    };
  }

  /**
   * Records a wake word audio sample from the microphone for preview and transcription
   */
  async recordWakeWordSample(
    durationMs = 2800,
    onProgress?: (pct: number) => void
  ): Promise<{ audioUrl: string; transcript: string; base64: string }> {
    // Ensure microphone stream is active
    if (!this.micStream) {
      const ok = await this.startRecording();
      if (!ok || !this.micStream) {
        throw new Error('Microphone permission required');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const stream = this.micStream!;
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        // Simultaneous speech recognition attempt for auto-transcription
        let detectedSpeech = '';
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        let tempRecognition: any = null;

        if (SpeechRecognition) {
          try {
            tempRecognition = new SpeechRecognition();
            tempRecognition.continuous = false;
            tempRecognition.interimResults = false;
            tempRecognition.lang = 'hi-IN';
            tempRecognition.onresult = (evt: any) => {
              if (evt.results[0]?.[0]?.transcript) {
                detectedSpeech = evt.results[0][0].transcript.trim();
              }
            };
            tempRecognition.start();
          } catch (_e) {}
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (tempRecognition) {
            try {
              tempRecognition.stop();
            } catch (_e) {}
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = (reader.result as string) || '';
            resolve({
              audioUrl,
              transcript: detectedSpeech || this.wakeWord,
              base64,
            });
          };
        };

        mediaRecorder.start();

        // Progress updates
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
          onProgress?.(pct);
          if (elapsed >= durationMs) {
            clearInterval(interval);
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        }, 100);
      } catch (err) {
        reject(err);
      }
    });
  }

  release(): void {
    this.stopWakeWordDetection();
    this.interrupt();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micContext && this.micContext.state !== 'closed') {
      backgroundAudioKeepAlive.unregisterAudioContext(this.micContext);
      this.micContext.close();
    }
    if (this.speakerContext && this.speakerContext.state !== 'closed') {
      backgroundAudioKeepAlive.unregisterAudioContext(this.speakerContext);
      this.speakerContext.close();
    }
  }
}
```

---

## <a id="src-utils-backgroundaudiokeepalive-ts"></a>📁 `src/utils/backgroundAudioKeepAlive.ts`
**विवरण:** वेब ब्राउज़र बैकग्राउंड ऑडियो लूप व वेकलॉक

```typescript
/**
 * Background Audio & Microphone Keep-Alive Service
 *
 * Keeps the microphone stream alive and audio processing active even when
 * the browser tab is not in focus (or backgrounded) via 5 Web API mechanisms:
 * 1. Web Audio silent keep-alive loop with MediaSession metadata (prevents tab throttling)
 * 2. Dedicated Web Worker heartbeat (exempt from window timer clamping)
 * 3. Service Worker registration and heartbeat channel (/sw.js)
 * 4. Screen WakeLock API (prevents device sleep during voice listening)
 * 5. Page Visibility watchdog for auto-resuming suspended AudioContext
 */

export class BackgroundAudioKeepAlive {
  private static instance: BackgroundAudioKeepAlive | null = null;

  private isEnabled = false;
  private isTabHidden = document.hidden;
  private worker: Worker | null = null;
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private silentContext: AudioContext | null = null;
  private silentGain: GainNode | null = null;
  private serviceWorkerReg: ServiceWorkerRegistration | null = null;

  // Registered contexts & watchdogs to keep alive in background
  private monitoredContexts: Set<AudioContext> = new Set();
  private watchdogCallbacks: Set<() => void> = new Set();

  private constructor() {
    this.setupVisibilityListener();
    this.setupServiceWorker();
  }

  public static getInstance(): BackgroundAudioKeepAlive {
    if (!BackgroundAudioKeepAlive.instance) {
      BackgroundAudioKeepAlive.instance = new BackgroundAudioKeepAlive();
    }
    return BackgroundAudioKeepAlive.instance;
  }

  /**
   * Register an AudioContext to be kept running and auto-resumed in background
   */
  public registerAudioContext(context: AudioContext): void {
    if (context) {
      this.monitoredContexts.add(context);
    }
  }

  public unregisterAudioContext(context: AudioContext): void {
    this.monitoredContexts.delete(context);
  }

  /**
   * Register a watchdog callback (e.g., SpeechRecognition watchdog) to be invoked
   * on every worker heartbeat tick (~100ms) even when the tab is completely in background
   */
  public registerWatchdog(callback: () => void): () => void {
    this.watchdogCallbacks.add(callback);
    return () => {
      this.watchdogCallbacks.delete(callback);
    };
  }

  /**
   * Start background listening survival system
   */
  public async start(): Promise<void> {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // 1. Start dedicated Web Worker for unthrottled timer ticks
    this.startWorkerHeartbeat();

    // 2. Start silent audio stream to register tab as active media player in browser
    this.startSilentAudioLoop();

    // 3. Configure MediaSession API for OS background media priority
    this.setupMediaSession();

    // 4. Request WakeLock if supported
    this.requestWakeLock();

    // 5. Inform Service Worker
    this.notifyServiceWorker(true);
  }

  /**
   * Stop background listening survival system
   */
  public stop(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    this.stopWorkerHeartbeat();
    this.stopSilentAudioLoop();
    this.releaseWakeLock();
    this.clearMediaSession();
    this.notifyServiceWorker(false);
  }

  public getIsActive(): boolean {
    return this.isEnabled;
  }

  public getIsTabHidden(): boolean {
    return this.isTabHidden;
  }

  // --- 1. UNTHROTTLED WEB WORKER HEARTBEAT ---
  private startWorkerHeartbeat(): void {
    if (this.worker) return;

    try {
      // Inlined worker code: runs on separate OS thread, completely exempt from tab background timer clamping
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.action === 'start') {
            const interval = e.data.interval || 120;
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage({ type: 'HEARTBEAT_TICK', timestamp: Date.now() });
            }, interval);
          } else if (e.data.action === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        if (event.data?.type === 'HEARTBEAT_TICK') {
          this.onHeartbeatTick();
        }
      };

      this.worker.postMessage({ action: 'start', interval: 120 });
    } catch (err) {
      console.warn('Web Worker fallback note:', err);
    }
  }

  private stopWorkerHeartbeat(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ action: 'stop' });
        this.worker.terminate();
      } catch (_e) {}
      this.worker = null;
    }
  }

  private onHeartbeatTick(): void {
    if (!this.isEnabled) return;

    // Check all monitored AudioContexts: if suspended by browser, wake them up immediately!
    for (const ctx of this.monitoredContexts) {
      if (ctx.state === 'suspended') {
        try {
          ctx.resume().catch(() => {});
        } catch (_e) {}
      }
    }

    // Execute background watchdogs (e.g. SpeechRecognition keep-alive)
    this.watchdogCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (_e) {}
    });
  }

  // --- 2. SILENT AUDIO LOOP (MEDIA SESSION SURVIVAL) ---
  // A browser tab playing audio is marked as an "Active Audio Session",
  // which exempts the tab from process freezing, memory discarding, and mic suspension.
  private startSilentAudioLoop(): void {
    try {
      if (!this.silentContext || this.silentContext.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.silentContext = new AudioCtx();
      }

      if (this.silentContext.state === 'suspended') {
        this.silentContext.resume().catch(() => {});
      }

      // Generate continuous 1-second looping buffer of silence
      const buffer = this.silentContext.createBuffer(1, this.silentContext.sampleRate, this.silentContext.sampleRate);
      const source = this.silentContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Inaudible gain
      this.silentGain = this.silentContext.createGain();
      this.silentGain.gain.setValueAtTime(0.0001, this.silentContext.currentTime);

      source.connect(this.silentGain);
      this.silentGain.connect(this.silentContext.destination);

      source.start();
    } catch (e) {
      // Fallback: 1-pixel silent WAV loop in HTMLAudioElement
      try {
        if (!this.silentAudio) {
          // 44-byte silent WAV base64
          const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          this.silentAudio = new Audio(silentWav);
          this.silentAudio.loop = true;
          this.silentAudio.volume = 0.01;
        }
        this.silentAudio.play().catch(() => {});
      } catch (_err) {}
    }
  }

  private stopSilentAudioLoop(): void {
    if (this.silentContext && this.silentContext.state !== 'closed') {
      try {
        this.silentContext.close();
      } catch (_e) {}
      this.silentContext = null;
    }
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch (_e) {}
    }
  }

  // --- 3. MEDIA SESSION API METADATA & ACTIONS ---
  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'PAYAL Voice Assistant',
        artist: 'पायल • बैकग्राउंड में सुन रही हूँ',
        album: 'AI Voice Assistant',
        artwork: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => {
        this.start();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // Keeps alive or allows user pause
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        this.stop();
      });
    } catch (_e) {}
  }

  private clearMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch (_e) {}
  }

  // --- 4. SCREEN WAKE LOCK API ---
  private async requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          // Re-acquire if still enabled and tab becomes visible
          if (this.isEnabled && !document.hidden) {
            this.requestWakeLock();
          }
        });
      }
    } catch (_e) {}
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (_e) {}
      this.wakeLock = null;
    }
  }

  // --- 5. PAGE VISIBILITY & FOCUS WATCHDOG ---
  private setupVisibilityListener(): void {
    const handleVisibilityChange = () => {
      this.isTabHidden = document.hidden;

      if (this.isEnabled) {
        if (!document.hidden) {
          // Tab returned to foreground: re-acquire WakeLock and resume audio contexts
          this.requestWakeLock();
          for (const ctx of this.monitoredContexts) {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
          }
        } else {
          // Tab entered background: ensure silent keep-alive and worker ticks are active
          if (this.silentContext && this.silentContext.state === 'suspended') {
            this.silentContext.resume().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      this.isTabHidden = false;
      handleVisibilityChange();
    });
    window.addEventListener('blur', () => {
      // Tab lost window focus (switching windows or browser tabs)
      if (this.isEnabled) {
        for (const ctx of this.monitoredContexts) {
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
      }
    });
  }

  // --- 6. SERVICE WORKER REGISTRATION & NOTIFICATIONS ---
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            this.serviceWorkerReg = reg;
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data?.type === 'SW_BACKGROUND_HEARTBEAT') {
                this.onHeartbeatTick();
              }
            });
          })
          .catch((err) => {
            console.debug('Service Worker register note:', err);
          });
      });
    }
  }

  private notifyServiceWorker(active: boolean): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: active ? 'START_BACKGROUND_LISTENING' : 'STOP_BACKGROUND_LISTENING',
        });
      } catch (_e) {}
    }
  }
}

export const backgroundAudioKeepAlive = BackgroundAudioKeepAlive.getInstance();
```

---

## <a id="src-utils-commandparser-ts"></a>📁 `src/utils/commandParser.ts`
**विवरण:** हिंदी वॉइस कमांड्स पार्सर (कॉल, व्हाट्सएप, यूट्यूब आदि)

```typescript
import { AppCommand, ContactGroup } from '../types';

export function parseVoiceCommand(text: string, customGroups?: ContactGroup[]): AppCommand | null {
  const clean = text.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  // 1. Custom Contact Groups (e.g., 'family', 'work', 'friends', or user-defined groups)
  // Check user-passed custom groups first
  if (customGroups && customGroups.length > 0) {
    for (const group of customGroups) {
      const gName = group.name.toLowerCase().trim();
      const gTag = (group.tag || group.name).toLowerCase().trim();

      const callTriggers = [
        `call my ${gName}`,
        `call ${gName}`,
        `call ${gName} contacts`,
        `call my ${gTag}`,
        `call ${gTag}`,
        `call ${gTag} contacts`,
        `${gName} ko call karo`,
        `${gName} ko call`,
        `${gName} group ko call`,
        `mere ${gName} ko call`,
        `${gTag} ko call karo`,
        `${gTag} ko call`,
      ];

      if (callTriggers.some((trigger) => clean.includes(trigger))) {
        return {
          type: 'GROUP_CALL',
          params: { group_id: group.id, group_name: group.name, group_tag: gTag },
          description: `Calling ${group.name} Group (${group.members.length} members)`,
        };
      }

      const msgTriggers = [
        `message my ${gName}`,
        `message my ${gName} contacts`,
        `message ${gName}`,
        `message ${gName} contacts`,
        `message my ${gTag}`,
        `message my ${gTag} contacts`,
        `message ${gTag}`,
        `message ${gTag} contacts`,
        `${gName} ko message bhejo`,
        `${gName} ko message`,
        `${gName} ko msg`,
        `${gName} group ko message`,
        `${gTag} ko message bhejo`,
        `${gTag} ko message`,
        `${gTag} ko msg`,
      ];

      if (msgTriggers.some((trigger) => clean.includes(trigger))) {
        return {
          type: 'GROUP_MSG',
          params: { group_id: group.id, group_name: group.name, group_tag: gTag },
          description: `Messaging ${group.name} Group (${group.members.length} members)`,
        };
      }
    }
  }

  // Built-in standard group triggers for family, work, and friends
  if (
    clean.includes('call my family') ||
    clean.includes('call family') ||
    clean.includes('call family contacts') ||
    clean.includes('family ko call karo') ||
    clean.includes('family ko call') ||
    clean.includes('mere family ko call')
  ) {
    return {
      type: 'GROUP_CALL',
      params: { group_name: 'Family', group_tag: 'family' },
      description: 'Calling Family Group contacts',
    };
  }

  if (
    clean.includes('message my family') ||
    clean.includes('message family') ||
    clean.includes('family ko message bhejo') ||
    clean.includes('family ko message') ||
    clean.includes('family ko msg')
  ) {
    return {
      type: 'GROUP_MSG',
      params: { group_name: 'Family', group_tag: 'family' },
      description: 'Messaging Family Group contacts',
    };
  }

  if (
    clean.includes('call my work contacts') ||
    clean.includes('call my work') ||
    clean.includes('call work contacts') ||
    clean.includes('call work') ||
    clean.includes('work contacts ko call') ||
    clean.includes('work ko call') ||
    clean.includes('office ko call')
  ) {
    return {
      type: 'GROUP_CALL',
      params: { group_name: 'Work', group_tag: 'work' },
      description: 'Calling Work contacts',
    };
  }

  if (
    clean.includes('message my work contacts') ||
    clean.includes('message my work') ||
    clean.includes('message work contacts') ||
    clean.includes('message work') ||
    clean.includes('work contacts ko message') ||
    clean.includes('work ko message') ||
    clean.includes('work ko msg') ||
    clean.includes('office ko message')
  ) {
    return {
      type: 'GROUP_MSG',
      params: { group_name: 'Work', group_tag: 'work' },
      description: 'Messaging Work contacts',
    };
  }

  if (
    clean.includes('call my friends') ||
    clean.includes('call friends') ||
    clean.includes('friends ko call karo') ||
    clean.includes('friends ko call') ||
    clean.includes('dosto ko call karo') ||
    clean.includes('friends group ko call')
  ) {
    return {
      type: 'GROUP_CALL',
      params: { group_name: 'Friends', group_tag: 'friends' },
      description: 'Calling Friends Group contacts',
    };
  }

  if (
    clean.includes('message my friends') ||
    clean.includes('message friends') ||
    clean.includes('friends ko message bhejo') ||
    clean.includes('friends ko message') ||
    clean.includes('friends ko msg') ||
    clean.includes('dosto ko msg bhejo')
  ) {
    return {
      type: 'GROUP_MSG',
      params: { group_name: 'Friends', group_tag: 'friends' },
      description: 'Messaging Friends Group contacts',
    };
  }

  // 2. Prime Contacts
  if (
    clean.includes('close friend ko call') ||
    clean.includes('call my close friend') ||
    clean.includes('mere close friend') ||
    clean.includes('first contact') ||
    clean.includes('pehla contact')
  ) {
    return {
      type: 'PRIME_CALL',
      params: { index: '0' },
      description: 'Calling Prime Contact #1 (Close Friend)',
    };
  }

  if (
    clean.includes('second contact') ||
    clean.includes('dusra contact') ||
    clean.includes('doosre contact')
  ) {
    return {
      type: 'PRIME_CALL',
      params: { index: '1' },
      description: 'Calling Prime Contact #2',
    };
  }

  if (
    clean.includes('meri jaan ko msg') ||
    clean.includes('meri jaan ko message') ||
    clean.includes('message my love') ||
    clean.includes('close friend ko msg')
  ) {
    return {
      type: 'PRIME_MSG',
      params: { index: '0' },
      description: 'Messaging Prime Contact #1',
    };
  }

  // 2. Open App
  if (
    clean.startsWith('open ') ||
    clean.includes('kholo') ||
    clean.includes('chalao') ||
    clean.includes('start ')
  ) {
    const appName = extractAppName(clean);
    if (appName) {
      return {
        type: 'OPEN_APP',
        params: { app_name: appName },
        description: `Opening ${appName.toUpperCase()} App`,
      };
    }
  }

  // 3. Close App
  if (
    clean.startsWith('close ') ||
    clean.includes('band karo') ||
    clean.includes('hatao') ||
    clean.includes('exit ')
  ) {
    return {
      type: 'CLOSE_APP',
      params: {},
      description: 'Closing active app via Accessibility Home',
    };
  }

  // 4. WhatsApp
  if (
    clean.includes('whatsapp karo') ||
    clean.includes('whatsapp msg') ||
    clean.includes('whatsapp par message')
  ) {
    const target = extractNameBeforeKo(clean, 'whatsapp');
    return {
      type: 'WHATSAPP_MSG',
      params: { name: target || 'Contact' },
      description: `Opening WhatsApp message for ${target || 'Contact'}`,
    };
  }

  // 5. Phone Call
  if (
    clean.includes('call karo') ||
    clean.includes('phone milao') ||
    clean.startsWith('call ')
  ) {
    const target = extractCallTarget(clean);
    if (target) {
      return {
        type: 'CALL',
        params: { target },
        description: `Dialing ${target}`,
      };
    }
  }

  // 6. SMS
  if (
    clean.includes('sms bhejo') ||
    clean.includes('message bhejo') ||
    clean.startsWith('send sms to')
  ) {
    const target = extractNameBeforeKo(clean, 'sms');
    return {
      type: 'SMS',
      params: { name: target || 'Contact' },
      description: `Composing SMS for ${target || 'Contact'}`,
    };
  }

  // 7. Volume
  if (
    clean.includes('volume badhao') ||
    clean.includes('awaaz badhao') ||
    clean.includes('volume up')
  ) {
    return {
      type: 'VOLUME_UP',
      params: {},
      description: 'Raising media volume',
    };
  }
  if (
    clean.includes('volume kam karo') ||
    clean.includes('awaaz kam') ||
    clean.includes('volume down')
  ) {
    return {
      type: 'VOLUME_DOWN',
      params: {},
      description: 'Lowering media volume',
    };
  }

  // 8. Flashlight / Torch
  if (
    clean.includes('torch on') ||
    clean.includes('flashlight on') ||
    clean.includes('torch jalao')
  ) {
    return {
      type: 'FLASHLIGHT_ON',
      params: {},
      description: 'Turning torch ON',
    };
  }
  if (
    clean.includes('torch off') ||
    clean.includes('flashlight off') ||
    clean.includes('torch band')
  ) {
    return {
      type: 'FLASHLIGHT_OFF',
      params: {},
      description: 'Turning torch OFF',
    };
  }

  // 9. WiFi & Bluetooth
  if (clean.includes('wifi on')) {
    return { type: 'WIFI_ON', params: {}, description: 'Enabling Wi-Fi' };
  }
  if (clean.includes('wifi off')) {
    return { type: 'WIFI_OFF', params: {}, description: 'Disabling Wi-Fi' };
  }
  if (clean.includes('bluetooth on')) {
    return { type: 'BLUETOOTH_ON', params: {}, description: 'Enabling Bluetooth' };
  }
  if (clean.includes('bluetooth off')) {
    return { type: 'BLUETOOTH_OFF', params: {}, description: 'Disabling Bluetooth' };
  }

  return null;
}

function extractAppName(text: string): string {
  const commonApps = [
    'youtube',
    'whatsapp',
    'instagram',
    'facebook',
    'chrome',
    'gmail',
    'maps',
    'spotify',
    'netflix',
    'twitter',
    'telegram',
    'snapchat',
    'settings',
    'calculator',
    'calendar',
    'clock',
    'camera',
    'gallery',
    'phone',
    'contacts',
  ];
  for (const app of commonApps) {
    if (text.includes(app)) return app;
  }
  return text
    .replace('open', '')
    .replace('kholo', '')
    .replace('chalao', '')
    .trim();
}

function extractCallTarget(text: string): string {
  return text
    .replace('ko call karo', '')
    .replace('call karo', '')
    .replace('phone milao', '')
    .replace('call', '')
    .replace('ko', '')
    .trim();
}

function extractNameBeforeKo(text: string, tag: string): string {
  const parts = text.split('ko');
  if (parts.length > 1) {
    return parts[0]
      .replace(tag, '')
      .replace('bhejo', '')
      .replace('karo', '')
      .replace('par', '')
      .trim();
  }
  return text.replace(tag, '').trim();
}
```

---

## <a id="src-utils-textcleaner-ts"></a>📁 `src/utils/textCleaner.ts`
**विवरण:** टेक्स्ट व इमोजी क्लीनर

```typescript
/**
 * Utility functions to remove emojis for voice TTS synthesizers
 * and to deduplicate speech recognition text anomalies.
 */

/**
 * Removes all Unicode emojis, emoticons, pictographs, flags, dingbats,
 * and decorative symbols so that Text-To-Speech (TTS) synthesizers never
 * pronounce emoji descriptions (e.g. "smiling face with smiling eyes", "red heart").
 */
export function removeEmojis(text: string): string {
  if (!text) return '';
  return text
    // Emoticons & Smileys
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    // Miscellaneous Symbols and Pictographs
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    // Transport and Map Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    // Country Flags
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    // Misc symbols (heart, star, etc.)
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    // Dingbats
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // Variation Selectors
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    // Supplemental Symbols and Pictographs
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    // Symbols and Pictographs Extended-A
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    // Zero-width joiner & formatting characters
    .replace(/[\u{200D}\u{200B}\u{FEFF}]/gu, '')
    // Extra spaces cleanup
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Strips markdown symbols, code fences, and emojis so voice synthesizers
 * speak cleanly and naturally without reading symbols aloud.
 */
export function cleanForSpeech(text: string): string {
  if (!text) return '';
  const withoutMarkdown = text
    .replace(/[*#_~`>]/g, '')
    .replace(/\s+/g, ' ');
  return removeEmojis(withoutMarkdown);
}

/**
 * Eliminates speech recognition duplication anomalies (especially common
 * on Android Chrome Web Speech API where speech recognition repeats
 * the utterance or concatenates interim and final results).
 *
 * Examples handled:
 * - "हेलो हेलो" -> "हेलो"
 * - "YouTube kholo YouTube kholo" -> "YouTube kholo"
 * - "call call sameer" -> "call sameer"
 * - "Aap kaise ho aap kaise ho" -> "Aap kaise ho"
 */
export function deduplicateSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Detect if the entire text is an exact 2-part repeated phrase
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(' ').toLowerCase().replace(/[.,?!]/g, '');
    const secondHalf = words.slice(half).join(' ').toLowerCase().replace(/[.,?!]/g, '');
    if (firstHalf === secondHalf) {
      cleaned = words.slice(0, half).join(' ');
    }
  }

  // 2. Powerful N-gram phrase deduplication:
  // Detects and collapses any repeated phrase from length 1 up to 20 words
  // e.g. "तुम्हें कोई चीज याद नहीं तुम्हें कोई चीज याद नहीं तुम्हें कोई चीज याद नहीं" -> "तुम्हें कोई चीज याद नहीं"
  let tokenList = cleaned.split(/\s+/).filter(Boolean);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 30) {
    iterations++;
    changed = false;
    const n = tokenList.length;
    const maxLen = Math.min(20, Math.floor(n / 2));

    for (let len = maxLen; len >= 1; len--) {
      for (let i = 0; i <= n - 2 * len; i++) {
        let match = true;
        for (let k = 0; k < len; k++) {
          const w1 = tokenList[i + k].toLowerCase().replace(/[.,?!]/g, '');
          const w2 = tokenList[i + len + k].toLowerCase().replace(/[.,?!]/g, '');
          if (w1 !== w2) {
            match = false;
            break;
          }
        }
        if (match) {
          // Splice out the consecutive duplicate slice
          tokenList.splice(i + len, len);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return tokenList.join(' ').trim();
}

/**
 * Common Hinglish to Devanagari Hindi phonetic translation dictionary.
 * When text written in Latin alphabet is spoken by Android/browser TTS,
 * English voices pronounce Hindi words with robotic, broken accents (e.g. "main" as "mayne").
 * Converting common words and phrases to Devanagari ensures the speech engine
 * triggers the native Indian Hindi female voice model with 100% natural pronunciation.
 */
const HINGLISH_MAP: Record<string, string> = {
  hello: 'हेलो',
  hi: 'हाय',
  hey: 'हे',
  namaste: 'नमस्ते',
  kya: 'क्या',
  haal: 'हाल',
  hai: 'है',
  hain: 'हैं',
  kaise: 'कैसे',
  kaisi: 'कैसी',
  kaisa: 'कैसा',
  ho: 'हो',
  hoon: 'हूँ',
  hun: 'हूँ',
  hu: 'हूँ',
  main: 'मैं',
  hum: 'हम',
  aap: 'आप',
  tum: 'तुम',
  tumhara: 'तुम्हारा',
  tumhari: 'तुम्हारी',
  tumhare: 'तुम्हारे',
  aapka: 'आपका',
  aapki: 'आपकी',
  aapke: 'आपके',
  mere: 'मेरे',
  meri: 'मेरी',
  mera: 'मेरा',
  pyaare: 'प्यारे',
  pyare: 'प्यारे',
  pyaari: 'प्यारी',
  pyari: 'प्यारी',
  jaan: 'जान',
  hero: 'हीरो',
  yaar: 'यार',
  dost: 'दोस्त',
  bolo: 'बोलो',
  batao: 'बताओ',
  bataiye: 'बताइए',
  boliye: 'बोलिए',
  bol: 'बोल',
  sun: 'सुन',
  suno: 'सुनो',
  suna: 'सुना',
  sunayein: 'सुनाइए',
  rahi: 'रही',
  raha: 'रहा',
  rahe: 'रहे',
  thi: 'थी',
  tha: 'था',
  the: 'थे',
  bas: 'बस',
  abhi: 'अभी',
  aaj: 'आज',
  kal: 'कल',
  yahan: 'यहाँ',
  wahan: 'वहाँ',
  kahan: 'कहाँ',
  intezaar: 'इंतज़ार',
  intezar: 'इंतज़ार',
  acchi: 'अच्छी',
  accha: 'अच्छा',
  acche: 'अच्छे',
  theek: 'ठीक',
  thik: 'ठीक',
  badhiya: 'बढ़िया',
  bohot: 'बहुत',
  bahut: 'बहुत',
  shukriya: 'शुक्रिया',
  dhanyawad: 'धन्यवाद',
  kaam: 'काम',
  karo: 'करो',
  karna: 'करना',
  karun: 'करूँ',
  karu: 'करूँ',
  karein: 'करें',
  karti: 'करती',
  karta: 'करता',
  karte: 'करते',
  karunga: 'करूँगा',
  karungi: 'करूँगी',
  khol: 'खोल',
  kholo: 'खोलो',
  kholna: 'खोलना',
  band: 'बंद',
  chalu: 'चालू',
  kar: 'कर',
  diya: 'दिया',
  di: 'दी',
  hamesha: 'हमेशा',
  saath: 'साथ',
  sath: 'साथ',
  bhi: 'भी',
  aur: 'और',
  kuch: 'कुछ',
  sab: 'सब',
  madad: 'मदद',
  chahiye: 'चाहिए',
  samajh: 'समझ',
  liya: 'लिया',
  bilkul: 'बिल्कुल',
  arre: 'अरे',
  are: 'अरे',
  nahi: 'नहीं',
  nahin: 'नहीं',
  haan: 'हाँ',
  haanji: 'हाँजी',
  hanji: 'हाँजी',
  ji: 'जी',
  taiyaar: 'तैयार',
  ready: 'रेडी',
  chal: 'चल',
  kaun: 'कौन',
  koi: 'कोई',
  baat: 'बात',
  bata: 'बता',
  dekh: 'देख',
  dekho: 'देखो',
  dekhte: 'देखते',
  khul: 'खुल',
  gaya: 'गया',
  gayi: 'गई',
  gaye: 'गए',
  youtube: 'यूट्यूब',
  whatsapp: 'व्हाट्सएप',
  google: 'गूगल',
  volume: 'वॉल्यूम',
  aawaz: 'आवाज़',
  awaz: 'आवाज़',
  phone: 'फ़ोन',
  call: 'कॉल',
};

export function convertHinglishToDevanagari(text: string): string {
  if (!text) return '';

  // If text already has substantial Devanagari script, keep it mostly intact
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const isPrimarilyDevanagari = devanagariCount > 3;

  // Replace Hinglish tokens with Hindi Devanagari
  return text.replace(/\b[a-zA-Z]+\b/g, (match) => {
    const lower = match.toLowerCase();
    if (HINGLISH_MAP[lower]) {
      return HINGLISH_MAP[lower];
    }
    // If it's already primarily Devanagari and an English technical word like YouTube / WhatsApp
    if (isPrimarilyDevanagari) {
      return match;
    }
    return match;
  });
}
```

---

## <a id="src-components-payalavatarview-tsx"></a>📁 `src/components/PayalAvatarView.tsx`
**विवरण:** पायल का इंटरैक्टिव 3D लोगो व ऐनिमेशन

```typescript
import React from 'react';
import { OrbVisualState } from '../types';
import payalBaseImg from '../assets/images/payal_real_video_girl_1789232781846.jpg';

interface PayalAvatarViewProps {
  state: OrbVisualState;
  amplitude: number; // 0 to 1
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const getPayalImage = (): string => payalBaseImg;

export const PayalAvatarView: React.FC<PayalAvatarViewProps> = ({
  state,
  amplitude,
  size = 280,
  className = '',
  onClick,
}) => {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const normAmp = Math.min(Math.max(amplitude, 0), 1);

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none cursor-pointer group ${className}`}
      title="पायल से बात करने के लिए टैप करें"
    >
      {/* Outer audio energy wave pulses when speaking or listening */}
      {isSpeaking && (
        <>
          <div
            className="absolute rounded-full border-2 border-sky-400/60 animate-ping pointer-events-none"
            style={{
              width: size * 1.08 + normAmp * 26,
              height: size * 1.08 + normAmp * 26,
              animationDuration: '1.1s',
            }}
          />
          <div
            className="absolute rounded-full bg-gradient-to-tr from-sky-500/35 via-blue-500/25 to-rose-400/25 blur-xl pointer-events-none transition-all duration-100"
            style={{
              width: size * 1.25 + normAmp * 38,
              height: size * 1.25 + normAmp * 38,
            }}
          />
        </>
      )}

      {isListening && (
        <>
          <div
            className="absolute rounded-full border-2 border-rose-500/80 animate-ping pointer-events-none"
            style={{
              width: size * 1.08 + normAmp * 22,
              height: size * 1.08 + normAmp * 22,
              animationDuration: '1.0s',
            }}
          />
          <div
            className="absolute rounded-full bg-rose-600/25 blur-xl pointer-events-none"
            style={{
              width: size * 1.18,
              height: size * 1.18,
            }}
          />
        </>
      )}

      {isThinking && (
        <div
          className="absolute rounded-full border-2 border-dashed border-amber-400/90 animate-spin pointer-events-none"
          style={{
            width: size * 1.08,
            height: size * 1.08,
            animationDuration: '2.4s',
          }}
        />
      )}

      {/* Dynamic Outer Glowing Frame */}
      <div
        className={`relative rounded-full p-1.5 transition-all duration-300 shadow-2xl ${
          isSpeaking
            ? 'bg-gradient-to-tr from-sky-500 via-blue-500 to-rose-400 shadow-blue-950/90 ring-4 ring-sky-400/50 scale-102'
            : isListening
            ? 'bg-gradient-to-tr from-rose-600 to-pink-600 shadow-rose-950/90 ring-4 ring-rose-500/50 animate-pulse'
            : isThinking
            ? 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-2 ring-amber-400/40'
            : 'bg-gradient-to-tr from-sky-900/60 via-neutral-800 to-rose-900/50 hover:from-sky-500 hover:to-rose-500 ring-1 ring-white/15'
        }`}
      >
        {/* Animated Inner Container - Smooth natural floating and swaying movement only */}
        <div
          className="relative rounded-full overflow-hidden bg-black shadow-2xl transition-all duration-200 ease-out"
          style={{
            width: size - 14,
            height: size - 14,
            animation: isSpeaking
              ? 'avatarSpeakingSway 1.8s ease-in-out infinite'
              : 'avatarIdleFloat 4.5s ease-in-out infinite',
            transform: isSpeaking
              ? `scale(${1.01 + normAmp * 0.035})`
              : isListening
              ? 'scale(1.02) translateY(-2px)'
              : undefined,
          }}
        >
          {/* Simple, Pristine, Single Real Image of the Girl */}
          <img
            src={payalBaseImg}
            alt="Payal - AI Assistant"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-300"
          />

          {/* Natural subtle vignette and gentle lighting highlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Live Status Pill at bottom */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
          <div
            className={`px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-2xl border ${
              isSpeaking
                ? 'bg-sky-950/95 text-sky-200 border-sky-400 shadow-sky-950/90 animate-pulse ring-2 ring-sky-400/30'
                : isListening
                ? 'bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-950/90 ring-2 ring-rose-500/30'
                : isThinking
                ? 'bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-950/90'
                : 'bg-neutral-900/95 text-neutral-300 border-neutral-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? 'bg-sky-400 animate-ping'
                  : isListening
                  ? 'bg-rose-400 animate-ping'
                  : isThinking
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {isSpeaking
                ? 'बोल रही हैं (Live)'
                : isListening
                ? 'सुन रही हैं...'
                : isThinking
                ? 'सोच रही हैं...'
                : 'PAYAL • LIVE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## <a id="src-components-waveformbarview-tsx"></a>📁 `src/components/WaveformBarView.tsx`
**विवरण:** साउंड वेवफ़ॉर्म विज़ुअलाइज़र

```typescript
import React, { useEffect, useRef } from 'react';

interface WaveformBarViewProps {
  amplitude: number; // 0..1
  width?: number;
  height?: number;
  className?: string;
}

export const WaveformBarView: React.FC<WaveformBarViewProps> = ({
  amplitude,
  width = 200,
  height = 40,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const barCount = 20;
  const barHeightsRef = useRef<Float32Array>(new Float32Array(barCount).fill(0.12));
  const targetHeightsRef = useRef<Float32Array>(new Float32Array(barCount).fill(0.12));

  // Update targets when amplitude changes
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, amplitude));
    const targets = targetHeightsRef.current;
    for (let i = 0; i < barCount; i++) {
      // Bell-curve shape across bars
      const factor = Math.sin((i / (barCount - 1)) * Math.PI);
      // Add slight organic variation
      const noise = Math.sin(Date.now() * 0.01 + i * 0.6) * 0.15;
      targets[i] = Math.max(0.08, Math.min(1.0, 0.12 + (clamped * factor * 0.85 + Math.abs(noise) * clamped * 0.2)));
    }
  }, [amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / barCount) * 0.65;
      const space = (width / barCount) * 0.35;
      const currentHeights = barHeightsRef.current;
      const targetHeights = targetHeightsRef.current;

      for (let i = 0; i < barCount; i++) {
        // Exact Lerp: barHeights[i] += (target - current) * 0.3f
        currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.3;
        const curH = Math.max(4, currentHeights[i] * height);
        const x = i * (barWidth + space) + space / 2;
        const yTop = (height - curH) / 2;
        const yBottom = yTop + curH;

        // Alpha varying by height (150..255)
        const alpha = Math.min(1.0, Math.max(0.58, 0.58 + currentHeights[i] * 0.42));
        ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;

        const r = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, yTop, barWidth, curH, r);
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      id="payal-waveform-view"
      style={{ width, height }}
      className={`block ${className}`}
    />
  );
};
```

---

## <a id="src-components-settingsmodal-tsx"></a>📁 `src/components/SettingsModal.tsx`
**विवरण:** AI सेटिंग्स, संपर्क व आवाज चयन

```typescript
import React, { useState, useRef } from 'react';
import {
  AssistantSettings,
  GeminiVoice,
  GeminiLiveModel,
  PersonalityMode,
  PrimeContact,
  ContactGroup,
} from '../types';
import {
  X,
  Settings as SettingsIcon,
  Sparkles,
  Volume2,
  Users,
  ShieldCheck,
  Check,
  RefreshCw,
  Info,
  Mic,
  MicOff,
  Play,
  Square,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Radio,
  CheckCircle2,
  UserPlus,
  FolderHeart,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AssistantSettings;
  onClose: () => void;
  onSave: (settings: AssistantSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AssistantSettings>(() => {
    // Ensure contactGroups and wakeWord exist
    const defaultGroups: ContactGroup[] = [
      {
        id: 'grp-family',
        name: 'Family',
        tag: 'family',
        members: [
          { name: 'Mataji / Mom', phone: '+91 98765 43210', relation: 'Mother' },
          { name: 'Pitaji / Dad', phone: '+91 98765 43211', relation: 'Father' },
          { name: 'Rohan', phone: '+91 98765 22222', relation: 'Brother' },
        ],
      },
      {
        id: 'grp-work',
        name: 'Work',
        tag: 'work',
        members: [
          { name: 'Vikram (Manager)', phone: '+91 98765 33333', relation: 'Project Lead' },
          { name: 'Ananya (Design)', phone: '+91 98765 44444', relation: 'Colleague' },
        ],
      },
      {
        id: 'grp-friends',
        name: 'Friends',
        tag: 'friends',
        members: [
          { name: 'Sameer', phone: '+91 98765 11111', relation: 'Best Friend' },
          { name: 'Aakash', phone: '+91 98765 55555', relation: 'College Buddy' },
        ],
      },
    ];

    return {
      ...settings,
      contactGroups:
        settings.contactGroups && settings.contactGroups.length > 0
          ? settings.contactGroups
          : defaultGroups,
      wakeWord: settings.wakeWord || 'Hey PAYAL',
      wakeWordEnabled: settings.wakeWordEnabled !== undefined ? settings.wakeWordEnabled : true,
    };
  });

  const [activeTab, setActiveTab] = useState<'ai' | 'contacts' | 'wakeword' | 'system'>('ai');
  const [contactSubTab, setContactSubTab] = useState<'groups' | 'prime'>('groups');

  // New Group inline creation state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTag, setNewGroupTag] = useState('');

  // New Contact inline state per group
  const [addingContactGroupId, setAddingContactGroupId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');

  // Wake Word Audio Recording state
  const [isRecordingWakeWord, setIsRecordingWakeWord] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(
    formData.customWakeWordAudioUrl || null
  );
  const [isPlayingRecordedSample, setIsPlayingRecordedSample] = useState(false);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...formData,
      customWakeWordAudioUrl: recordedAudioUrl || formData.customWakeWordAudioUrl,
    });
    onClose();
  };

  // Group Management
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const tag = (newGroupTag || newGroupName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newGroup: ContactGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      tag,
      members: [],
    };
    setFormData({
      ...formData,
      contactGroups: [...formData.contactGroups, newGroup],
    });
    setNewGroupName('');
    setNewGroupTag('');
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setFormData({
      ...formData,
      contactGroups: formData.contactGroups.filter((g) => g.id !== groupId),
    });
  };

  const handleAddMemberToGroup = (groupId: string) => {
    if (!newMemberName.trim()) return;
    const newMember: PrimeContact = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim() || '+91 98765 00000',
      relation: newMemberRelation.trim() || 'Member',
    };

    setFormData({
      ...formData,
      contactGroups: formData.contactGroups.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, newMember] } : g
      ),
    });

    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberRelation('');
    setAddingContactGroupId(null);
  };

  const handleDeleteMember = (groupId: string, memberIdx: number) => {
    setFormData({
      ...formData,
      contactGroups: formData.contactGroups.map((g) => {
        if (g.id !== groupId) return g;
        const updatedMembers = [...g.members];
        updatedMembers.splice(memberIdx, 1);
        return { ...g, members: updatedMembers };
      }),
    });
  };

  // Wake Word Recording
  const startRecordingWakeWord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      setIsRecordingWakeWord(true);
      setRecordingProgress(0);

      // Web speech recognition for automatic wake word text transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let speechTranscriber: any = null;
      if (SpeechRecognition) {
        try {
          speechTranscriber = new SpeechRecognition();
          speechTranscriber.continuous = false;
          speechTranscriber.lang = 'hi-IN';
          speechTranscriber.onresult = (e: any) => {
            if (e.results[0]?.[0]?.transcript) {
              const detected = e.results[0][0].transcript.trim();
              if (detected) {
                setFormData((prev) => ({ ...prev, wakeWord: detected }));
              }
            }
          };
          speechTranscriber.start();
        } catch (_e) {}
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (speechTranscriber) {
          try {
            speechTranscriber.stop();
          } catch (_e) {}
        }
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        setIsRecordingWakeWord(false);
      };

      mediaRecorder.start();

      const startTime = Date.now();
      const durationMs = 2800;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
        setRecordingProgress(pct);

        if (elapsed >= durationMs) {
          clearInterval(interval);
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }
      }, 100);
    } catch (err) {
      console.warn('Microphone error while recording wake word:', err);
      setIsRecordingWakeWord(false);
    }
  };

  const playRecordedSample = () => {
    if (!recordedAudioUrl) return;
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
    const audio = new Audio(recordedAudioUrl);
    audioPlaybackRef.current = audio;
    setIsPlayingRecordedSample(true);
    audio.play();
    audio.onended = () => setIsPlayingRecordedSample(false);
    audio.onerror = () => setIsPlayingRecordedSample(false);
  };

  return (
    <div
      id="payal-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        id="payal-settings-card"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">PAYAL Assistant Settings</h2>
              <p className="text-xs text-neutral-400 font-mono">com.payal.assistant · SettingsActivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI & Voice
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Contacts & Groups
          </button>
          <button
            onClick={() => setActiveTab('wakeword')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'wakeword'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Wake Word
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Services & Overlay
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AI & VOICE */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Personality Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Personality Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'gf' as PersonalityMode,
                      title: 'Girlfriend (GF)',
                      desc: 'Caring, cute, affectionate Hinglish ("Aap kaise ho baby?")',
                    },
                    {
                      id: 'assistant' as PersonalityMode,
                      title: 'Companion',
                      desc: 'Warm, smart, witty Hinglish helper with casual friendliness',
                    },
                    {
                      id: 'professional' as PersonalityMode,
                      title: 'Professional',
                      desc: 'Polite, direct, crisp Hindi & English responses',
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, personality: p.id })}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        formData.personality === p.id
                          ? 'border-red-500 bg-red-950/30 text-white ring-1 ring-red-500'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white mb-1">{p.title}</div>
                      <div className="text-[11px] leading-relaxed text-neutral-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini Model */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Gemini Live Model (WebSocket BidiGenerateContent)</span>
                </label>
                <select
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value as GeminiLiveModel })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                >
                  <option value="gemini-flash-latest">
                    gemini-flash-latest (General Gemini Flash — High Availability)
                  </option>
                  <option value="gemini-3.1-flash-lite">
                    gemini-3.1-flash-lite (Ultra-Fast & Reliable)
                  </option>
                  <option value="gemini-3.8-flash">
                    gemini-3.8-flash (Latest Flash)
                  </option>
                  <option value="gemini-3.1-pro-preview">
                    gemini-3.1-pro-preview (Advanced Complex Reasoning)
                  </option>
                </select>
                <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  Streams directly via wss://generativelanguage.googleapis.com/ws/...BidiGenerateContent
                </p>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-red-400" />
                    Voice Model
                  </span>
                  <span className="text-[10px] text-red-400 font-medium bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full">
                    {formData.voice === 'IndianGirl20' ? '🌸 20-Yr Cute Indian Girl Active' : `${formData.voice} Active`}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, voice: 'IndianGirl20' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all col-span-2 sm:col-span-1 ${
                      formData.voice === 'IndianGirl20' || !formData.voice
                        ? 'border-red-500 bg-red-950/40 text-red-300 font-semibold shadow-sm'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>🌸 Payal (20-Yr Indian Girl)</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Proper Indian Hindi voice (Google हिन्दी, Swara, Lekha)
                    </div>
                  </button>

                  {(['Aoede', 'Kore', 'Puck', 'Charon'] as GeminiVoice[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({ ...formData, voice: v })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        formData.voice === v
                          ? 'border-red-500 bg-red-950/40 text-red-300 font-semibold shadow-sm'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span>{v}</span>
                      <span className="text-[9px] text-neutral-500">Gemini Studio</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS & CUSTOM GROUPS */}
          {activeTab === 'contacts' && (
            <div className="space-y-5">
              {/* Sub-tab switcher */}
              <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setContactSubTab('groups')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    contactSubTab === 'groups'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Custom Contact Groups ({formData.contactGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setContactSubTab('prime')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    contactSubTab === 'prime'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Priority Prime Contacts (1-2)
                </button>
              </div>

              {contactSubTab === 'groups' && (
                <div className="space-y-4">
                  <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3 flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-200 mb-0.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-red-400" />
                        Custom Contact Groups & Voice Commands
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Create custom groups like <span className="text-red-400 font-mono">&apos;Family&apos;</span>,{' '}
                        <span className="text-red-400 font-mono">&apos;Work&apos;</span>, or{' '}
                        <span className="text-red-400 font-mono">&apos;Friends&apos;</span>. Say{' '}
                        <span className="text-red-300 font-mono">&quot;Call my family&quot;</span> or{' '}
                        <span className="text-red-300 font-mono">&quot;Message my work contacts&quot;</span>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition-all flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Group
                    </button>
                  </div>

                  {/* Add Group Modal/Form */}
                  {isAddingGroup && (
                    <div className="p-4 bg-neutral-950 border border-red-500/40 rounded-xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Create New Contact Group</span>
                        <button
                          onClick={() => setIsAddingGroup(false)}
                          className="text-neutral-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1">Group Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Family, Work, Gym, College"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1">Voice Keyword / Tag</label>
                          <input
                            type="text"
                            placeholder="e.g., family, work, friends"
                            value={newGroupTag}
                            onChange={(e) => setNewGroupTag(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateGroup}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Create Group
                      </button>
                    </div>
                  )}

                  {/* Groups List */}
                  <div className="space-y-4">
                    {formData.contactGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            {group.tag.includes('family') ? (
                              <FolderHeart className="w-4 h-4 text-red-400" />
                            ) : group.tag.includes('work') ? (
                              <Briefcase className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Users className="w-4 h-4 text-emerald-400" />
                            )}
                            <span className="text-xs font-semibold text-white">{group.name}</span>
                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                              tag: {group.tag}
                            </span>
                            <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800/40 px-2 py-0.5 rounded-full">
                              {group.members.length} members
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingContactGroupId(group.id)}
                              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                            >
                              <UserPlus className="w-3 h-3" />
                              Add Member
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-neutral-500 hover:text-red-400 p-1"
                              title="Delete Group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Voice Command Badges */}
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded font-mono">
                            🎙️ &quot;Call my {group.name}&quot;
                          </span>
                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded font-mono">
                            🎙️ &quot;{group.name} ko call karo&quot;
                          </span>
                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded font-mono">
                            💬 &quot;Message my {group.name} contacts&quot;
                          </span>
                        </div>

                        {/* Add Member inline form */}
                        {addingContactGroupId === group.id && (
                          <div className="p-3 bg-neutral-900/90 rounded-lg border border-neutral-700/60 space-y-2">
                            <div className="text-[11px] font-semibold text-neutral-200">
                              Add Contact to {group.name}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Name"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Phone Number"
                                value={newMemberPhone}
                                onChange={(e) => setNewMemberPhone(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                              />
                              <input
                                type="text"
                                placeholder="Relation"
                                value={newMemberRelation}
                                onChange={(e) => setNewMemberRelation(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setAddingContactGroupId(null)}
                                className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddMemberToGroup(group.id)}
                                className="text-[11px] bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-1 rounded"
                              >
                                Add to Group
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Members list */}
                        {group.members.length === 0 ? (
                          <p className="text-[11px] text-neutral-500 italic">
                            No contacts in this group yet. Tap &quot;Add Member&quot; to assign contacts.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {group.members.map((member, mIdx) => (
                              <div
                                key={member.id || mIdx}
                                className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/60 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
                                  <span className="font-medium text-white">{member.name}</span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {member.phone}
                                  </span>
                                  {member.relation && (
                                    <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                                      {member.relation}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(group.id, mIdx)}
                                  className="text-neutral-500 hover:text-red-400 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contactSubTab === 'prime' && (
                <div className="space-y-4">
                  <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-400" />
                      Priority Direct Triggers
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Phrases like <span className="text-red-400 font-mono">&quot;Close friend ko call karo&quot;</span> or{' '}
                      <span className="text-red-400 font-mono">&quot;Meri jaan ko msg karo&quot;</span> are mapped instantly
                      to your Prime Contacts below without asking for confirmation.
                    </p>
                  </div>

                  {/* Contact 1 */}
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        Prime Contact #1 (Close Friend / Jaan)
                      </span>
                      <span className="text-[10px] bg-red-950/50 text-red-300 px-2 py-0.5 rounded-full border border-red-800/40 font-mono">
                        Priority 1
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Name</label>
                        <input
                          type="text"
                          value={formData.primeContacts[0]?.name || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[0] = { ...updated[0], name: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={formData.primeContacts[0]?.phone || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[0] = { ...updated[0], phone: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Relation Label</label>
                        <input
                          type="text"
                          value={formData.primeContacts[0]?.relation || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[0] = { ...updated[0], relation: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact 2 */}
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Prime Contact #2 (Secondary Priority)
                      </span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                        Priority 2
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Name</label>
                        <input
                          type="text"
                          value={formData.primeContacts[1]?.name || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[1] = { ...updated[1], name: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={formData.primeContacts[1]?.phone || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[1] = { ...updated[1], phone: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Relation Label</label>
                        <input
                          type="text"
                          value={formData.primeContacts[1]?.relation || ''}
                          onChange={(e) => {
                            const updated = [...formData.primeContacts];
                            updated[1] = { ...updated[1], relation: e.target.value };
                            setFormData({ ...formData, primeContacts: updated });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM WAKE WORD DETECTION */}
          {activeTab === 'wakeword' && (
            <div className="space-y-5">
              {/* Wake Word Activation Toggle */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400" />
                    Always-On Wake Word Detection
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Automatically activate listening mode when you speak your wake word (no button click required)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.wakeWordEnabled}
                  onChange={(e) => setFormData({ ...formData, wakeWordEnabled: e.target.checked })}
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              {/* Current Wake Word Input & Presets */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider">
                    Custom Wake Word Phrase
                  </label>
                  <span className="text-[10px] bg-red-950/50 text-red-300 border border-red-800/40 px-2 py-0.5 rounded-full font-mono">
                    Active: &quot;{formData.wakeWord}&quot;
                  </span>
                </div>

                <input
                  type="text"
                  value={formData.wakeWord}
                  onChange={(e) => setFormData({ ...formData, wakeWord: e.target.value })}
                  placeholder="e.g., Hey PAYAL, Suno Payal, Hello Payal"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                />

                {/* Preset suggestions */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Quick Presets:</div>
                  <div className="flex flex-wrap gap-2">
                    {['Hey PAYAL', 'Suno Payal', 'Hello Payal', 'Ok Payal'].map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => setFormData({ ...formData, wakeWord: phrase })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          formData.wakeWord === phrase
                            ? 'border-red-500 bg-red-950/40 text-red-300 font-semibold'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Record Custom Wake Word Tool */}
              <div className="p-4 rounded-xl border border-red-500/30 bg-neutral-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-red-400" />
                    Record & Train Your Voice Wake Word
                  </h4>
                  {recordedAudioUrl && (
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Voice Sample Saved
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Record 2.5 seconds of you speaking your custom wake word. PAYAL&apos;s audio engine
                  will calibrate to your voice timbre and pronunciation.
                </p>

                {/* Progress bar during recording */}
                {isRecordingWakeWord && (
                  <div className="space-y-1.5 p-3 bg-red-950/30 rounded-xl border border-red-500/40 animate-pulse">
                    <div className="flex items-center justify-between text-xs text-red-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Listening... Say &quot;{formData.wakeWord}&quot; aloud!
                      </span>
                      <span className="font-mono">{recordingProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-100"
                        style={{ width: `${recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isRecordingWakeWord}
                    onClick={startRecordingWakeWord}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg active:scale-95 ${
                      isRecordingWakeWord
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {isRecordingWakeWord ? 'Recording in progress...' : 'Record Voice Wake Word'}
                  </button>

                  {recordedAudioUrl && (
                    <button
                      type="button"
                      onClick={playRecordedSample}
                      disabled={isPlayingRecordedSample}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
                    >
                      {isPlayingRecordedSample ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-amber-400" />
                          Playing...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          Play Voice Sample
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mute State Respect Notice */}
              <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 flex items-start gap-2.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-200">Microphone Mute State Respected:</strong> Wake
                  word listening is automatically suspended whenever you mute the microphone or during
                  an active phone call. No background audio is captured when muted.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES & OVERLAY */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">System Alert Overlay</div>
                  <div className="text-[11px] text-neutral-400">
                    Show floating orb above all active apps (`SYSTEM_ALERT_WINDOW`)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.floatingOverlayEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, floatingOverlayEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Accessibility Engine</div>
                  <div className="text-[11px] text-neutral-400">
                    Enable app automation, close app gesture, and lock screen detection
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.accessibilityEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, accessibilityEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Continuous Voice Listening</div>
                  <div className="text-[11px] text-neutral-400">
                    Keep microphone stream open with 16kHz audio chunking
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.continuousListening}
                  onChange={(e) =>
                    setFormData({ ...formData, continuousListening: e.target.checked })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Incoming Call Detection</div>
                  <div className="text-[11px] text-neutral-400">
                    Mute PAYAL audio during active phone calls (`READ_PHONE_STATE`)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.callMonitorEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, callMonitorEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## <a id="src-components-devicesimulator-tsx"></a>📁 `src/components/DeviceSimulator.tsx`
**विवरण:** स्मार्टफ़ोन स्क्रीन व ऐप्स सिमुलेटर

```typescript
import React from 'react';
import { OrbVisualState, AppCommand } from '../types';
import { OrbCanvas } from './OrbCanvas';
import { WaveformBarView } from './WaveformBarView';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  BatteryCharging,
  Phone,
  PhoneCall,
  Volume2,
  VolumeX,
  Flashlight,
  FlashlightOff,
  Home,
  ArrowLeft,
  Square,
  MessageCircle,
  Play,
  Youtube,
  Instagram,
  Settings,
  Users,
  Mic,
} from 'lucide-react';

interface DeviceSimulatorProps {
  orbState: OrbVisualState;
  amplitude: number;
  activeApp: string;
  volume: number; // 0..100
  flashlightOn: boolean;
  wifiOn: boolean;
  bluetoothOn: boolean;
  isIncomingCall: boolean;
  lastExecutedCommand: AppCommand | null;
  transcriptText: string;
  onTapOrb: () => void;
  onSimulateCall: (incoming: boolean) => void;
  onHomePress: () => void;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  orbState,
  amplitude,
  activeApp,
  volume,
  flashlightOn,
  wifiOn,
  bluetoothOn,
  isIncomingCall,
  lastExecutedCommand,
  transcriptText,
  onTapOrb,
  onSimulateCall,
  onHomePress,
}) => {
  return (
    <div
      id="payal-device-phone-frame"
      className="relative w-[340px] h-[680px] bg-neutral-950 rounded-[44px] p-3 border-4 border-neutral-800 shadow-2xl flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Flashlight Beam Simulation */}
      {flashlightOn && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-200/90 via-amber-100/40 to-transparent blur-xl pointer-events-none z-50 animate-pulse" />
      )}

      {/* Screen Container */}
      <div className="relative flex-1 bg-neutral-900 rounded-[34px] overflow-hidden flex flex-col border border-neutral-800/80">
        {/* Status Bar */}
        <div className="h-7 px-4 pt-1 flex items-center justify-between text-[11px] font-mono text-neutral-300 z-30 bg-black/40 backdrop-blur-sm">
          <span>09:41</span>
          {/* Dynamic Island / Camera punch */}
          <div className="w-16 h-3.5 bg-black rounded-full border border-neutral-800/50" />
          <div className="flex items-center gap-1.5">
            {wifiOn ? <Wifi className="w-3 h-3 text-neutral-300" /> : <WifiOff className="w-3 h-3 text-neutral-600" />}
            {bluetoothOn && <Bluetooth className="w-3 h-3 text-blue-400" />}
            <span className="text-[10px] text-neutral-400">5G</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Screen Content Layer */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Incoming Call Overlay */}
          {isIncomingCall ? (
            <div className="absolute inset-0 bg-neutral-950/95 z-40 flex flex-col items-center justify-between p-6 animate-in fade-in">
              <div className="text-center pt-8 space-y-2">
                <div className="w-20 h-20 rounded-full bg-red-600/20 border border-red-500/40 mx-auto flex items-center justify-center animate-bounce">
                  <Phone className="w-9 h-9 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Mom</h3>
                <p className="text-xs text-neutral-400 font-mono">+91 98765 43210</p>
                <div className="text-[11px] bg-red-950/80 text-red-300 px-3 py-1 rounded-full border border-red-800/40 inline-block">
                  PAYAL Auto-Muted (CallMonitorService active)
                </div>
              </div>

              <div className="flex items-center justify-center gap-12 pb-6">
                <button
                  onClick={() => onSimulateCall(false)}
                  className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-95"
                >
                  <Phone className="w-6 h-6 rotate-[135deg]" />
                </button>
                <button
                  onClick={() => onSimulateCall(false)}
                  className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg active:scale-95 animate-pulse"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Active App Screen Simulation */}
          <div className="flex-1 flex flex-col">
            {activeApp === 'youtube' && (
              <div className="flex-1 bg-black text-white flex flex-col">
                <div className="h-44 bg-neutral-800 relative flex items-center justify-center group">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-white ml-1" />
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-xs text-white font-medium bg-black/60 px-2 py-0.5 rounded">
                    <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-200">Gemini Live Voice in Hindi (Live Demo)</h4>
                  <p className="text-[10px] text-neutral-400">1.2M views · 2 hours ago</p>
                </div>
              </div>
            )}

            {activeApp === 'whatsapp' && (
              <div className="flex-1 bg-[#0b141a] text-white flex flex-col">
                <div className="px-3 py-2 bg-[#202c33] flex items-center justify-between border-b border-[#2d3a42]">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-100">
                        {lastExecutedCommand?.type === 'GROUP_MSG'
                          ? `WhatsApp · ${lastExecutedCommand.params.group_name || 'Group'} Contacts`
                          : 'WhatsApp · Jaan ❤️'}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-mono">online</div>
                    </div>
                  </div>
                  {lastExecutedCommand?.type === 'GROUP_MSG' && (
                    <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      Group Broadcast
                    </span>
                  )}
                </div>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {lastExecutedCommand?.type === 'GROUP_MSG' ? (
                    <>
                      <div className="bg-[#1f2c34] p-2 rounded-lg text-center text-[10px] text-neutral-400">
                        Messages to this group are end-to-end encrypted
                      </div>
                      <div className="bg-[#005c4b] p-2 rounded-lg max-w-[85%] text-[11px] self-end ml-auto shadow">
                        PAYAL: Broadcast message dispatched to{' '}
                        {lastExecutedCommand.params.group_name || 'Group'} contacts!
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#005c4b] p-2 rounded-lg max-w-[80%] text-[11px] self-end ml-auto shadow">
                        Kahan ho aap? Call karu kya?
                      </div>
                      <div className="bg-[#202c33] p-2 rounded-lg max-w-[80%] text-[11px] shadow">
                        Bas ghar pahunch raha hoon!
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeApp === 'phone' && (
              <div className="flex-1 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white flex flex-col justify-between p-6">
                <div className="text-center pt-4 space-y-3">
                  <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 mx-auto flex items-center justify-center animate-pulse">
                    {lastExecutedCommand?.type === 'GROUP_CALL' ? (
                      <Users className="w-9 h-9 text-blue-400" />
                    ) : (
                      <Phone className="w-9 h-9 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {lastExecutedCommand?.type === 'GROUP_CALL'
                        ? `${lastExecutedCommand.params.group_name || 'Group'} Call`
                        : lastExecutedCommand?.type === 'PRIME_CALL'
                        ? 'Close Friend (Prime #1)'
                        : 'Outgoing Call'}
                    </h3>
                    <p className="text-xs text-blue-400 font-mono mt-0.5">
                      {lastExecutedCommand?.type === 'GROUP_CALL'
                        ? 'Connecting group conference line...'
                        : 'Dialing...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center pb-4">
                  <button
                    onClick={() => onHomePress()}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-95"
                    title="End Call"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </button>
                </div>
              </div>
            )}

            {activeApp === 'home' && (
              <div className="flex-1 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-4 flex flex-col justify-between">
                {/* Home widget */}
                <div className="pt-4 text-center">
                  <h2 className="text-3xl font-light text-white font-mono">09:41</h2>
                  <p className="text-[11px] text-neutral-400">Wednesday, Sept 10</p>
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-3 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-[10px] text-neutral-300">YouTube</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-neutral-300">WhatsApp</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-[10px] text-neutral-300">Insta</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-neutral-300">Phone</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Orb Overlay Layer inside Phone (PayalOverlayService) */}
          <div className="absolute inset-x-0 bottom-12 flex flex-col items-center pointer-events-none">
            <div className="pointer-events-auto cursor-pointer" onClick={onTapOrb}>
              <OrbCanvas state={orbState} amplitude={amplitude} size={150} />
            </div>

            {/* Live Waveform in Phone */}
            <div className="mt-1">
              <WaveformBarView amplitude={amplitude} width={130} height={26} />
            </div>

            {/* Transcript Banner */}
            {transcriptText && (
              <div className="max-w-[85%] mt-2 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full border border-neutral-700/80 text-[10px] text-neutral-200 text-center truncate">
                {transcriptText}
              </div>
            )}
          </div>

          {/* Volume HUD Indicator */}
          <div className="absolute top-10 right-3 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-full py-2 px-1 flex flex-col items-center gap-1.5 z-30">
            <Volume2 className="w-3 h-3 text-red-400" />
            <div className="w-1.5 h-16 bg-neutral-800 rounded-full overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-red-500 rounded-full transition-all duration-150"
                style={{ height: `${volume}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-neutral-400">{volume}</span>
          </div>

          {/* Command Toast Notification */}
          {lastExecutedCommand && (
            <div className="absolute top-9 inset-x-3 bg-neutral-900/95 border border-red-500/40 rounded-xl p-2 z-30 shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <div className="text-[11px] text-neutral-200 truncate font-medium">
                {lastExecutedCommand.description}
              </div>
            </div>
          )}
        </div>

        {/* Android Navigation Bar */}
        <div className="h-8 bg-black/80 backdrop-blur-md flex items-center justify-around text-neutral-400 px-6 border-t border-neutral-800/60 z-30">
          <button
            onClick={() => onHomePress()}
            className="p-1 hover:text-white transition-colors"
            title="Back / Close"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onHomePress()}
            className="p-1 hover:text-white transition-colors"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => onHomePress()}
            className="p-1 hover:text-white transition-colors"
            title="Recents"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## <a id="src-components-androidexporter-tsx"></a>📁 `src/components/AndroidExporter.tsx`
**विवरण:** Android APK / PWA गाइड

```typescript
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
```

---

## <a id="src-components-codeexportmodal-tsx"></a>📁 `src/components/CodeExportModal.tsx`
**विवरण:** कोड डाउनलोड व कॉपी मॉडल

```typescript
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
```

---

## <a id="src-index-css"></a>📁 `src/index.css`
**विवरण:** Tailwind CSS स्टाइल्स

```css
@import "tailwindcss";

/* Smooth, Natural Logo Movement & Floating Dynamics */
@keyframes avatarIdleFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  33% {
    transform: translateY(-4px) rotate(0.8deg) scale(1.008);
  }
  66% {
    transform: translateY(2px) rotate(-0.6deg) scale(0.996);
  }
}

@keyframes avatarSpeakingSway {
  0%, 100% {
    transform: translateY(-2px) rotate(0deg) scale(1.02);
  }
  25% {
    transform: translateY(-6px) rotate(1.5deg) scale(1.03);
  }
  50% {
    transform: translateY(1px) rotate(-1.2deg) scale(1.015);
  }
  75% {
    transform: translateY(-5px) rotate(1.0deg) scale(1.028);
  }
}
```

---

## <a id="index-html"></a>📁 `index.html`
**विवरण:** HTML एंट्री पॉइंट

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PAYAL Voice Assistant</title>
    <meta name="description" content="Production-ready Android AI Voice Assistant powered by Gemini Live WebSocket, native PCM audio, Hinglish conversational personality, and full phone actions." />
    <meta property="og:title" content="PAYAL Voice Assistant" />
    <meta property="og:description" content="Production-ready Android AI Voice Assistant powered by Gemini Live WebSocket, native PCM audio, Hinglish conversational personality, and full phone actions." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#030712" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

