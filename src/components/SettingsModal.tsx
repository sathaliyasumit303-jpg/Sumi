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
