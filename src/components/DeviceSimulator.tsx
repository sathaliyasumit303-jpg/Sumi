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
