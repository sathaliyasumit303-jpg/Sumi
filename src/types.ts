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
