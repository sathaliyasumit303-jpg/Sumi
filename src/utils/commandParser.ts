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
