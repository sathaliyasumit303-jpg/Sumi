import express from 'express';
import path from 'path';
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
