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
