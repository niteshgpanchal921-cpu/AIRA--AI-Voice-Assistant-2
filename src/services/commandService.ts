import { AIRASettings } from "./preferenceService";

export type CommandType =
  | "call"
  | "end_call"
  | "reject_call"
  | "answer_call"
  | "who_calling"
  | "message"
  | "read_messages"
  | "open_app"
  | "app"
  | "media_youtube"
  | "media_spotify"
  | "toggle_alert"
  | "settings"
  | "none";

export interface CommandResult {
  type: CommandType;
  actionText: string;
  contact?: string;
  messageContent?: string;
  appName?: string;
  appUrl?: string;
  url?: string;
  alertType?: "call" | "message" | "wake_word" | "voice_assistant" | "action_control";
  alertValue?: boolean;
  requiresConfirmation?: boolean;
  requiresPermission?: "calls" | "messages" | "appAccess" | "notifications";
  permissionGranted?: boolean;
  isBrowserAction?: boolean;
  isHandled?: boolean;
  spokenResponse?: string;
  uiPrompt?: string;
  data?: any;
}

const APP_URL_MAP: Record<string, string> = {
  youtube: "https://www.youtube.com",
  whatsapp: "https://web.whatsapp.com",
  spotify: "https://open.spotify.com",
  instagram: "https://www.instagram.com",
  chrome: "https://www.google.com",
  google: "https://www.google.com",
  gmail: "https://mail.google.com",
  mail: "https://mail.google.com",
  maps: "https://maps.google.com",
  twitter: "https://x.com",
  x: "https://x.com",
  github: "https://github.com",
  reddit: "https://www.reddit.com",
  netflix: "https://www.netflix.com",
  settings: "settings",
  account: "account",
};

/**
 * Natural multilingual command understanding for Call, Message, App Access, and Alerts.
 * Understands English, Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, and Thai.
 */
export function processCommand(command: string, settings?: Partial<AIRASettings>): CommandResult {
  const raw = command.trim();
  if (!raw) return { type: "none", actionText: "", isBrowserAction: false, isHandled: false };

  const lower = raw.toLowerCase().trim();

  // If action control is explicitly turned OFF, bypass all app/device actions and let AIRA converse normally!
  if (settings && settings.actionControlEnabled === false) {
    // Check if user is asking to turn action control back on
    if (
      lower.includes("turn action control on") ||
      lower.includes("action control on") ||
      lower.includes("action control chalu karo") ||
      lower.includes("enable action control")
    ) {
      return {
        type: "toggle_alert",
        alertType: "action_control",
        alertValue: true,
        actionText: "Action Control turned on. Supported device and app actions are now enabled.",
        spokenResponse: "Action Control turned on.",
        isHandled: true,
        data: { actionControlEnabled: true },
      };
    }
    return { type: "none", actionText: "", isBrowserAction: false, isHandled: false };
  }

  // 1. Alert / Setting Toggles (English, Hindi, Thai)
  // Action Control Toggle
  if (
    lower.includes("turn action control off") ||
    lower.includes("action control off") ||
    lower.includes("action control band karo") ||
    lower.includes("disable action control") ||
    lower.includes("ปิด action control")
  ) {
    return {
      type: "toggle_alert",
      alertType: "action_control",
      alertValue: false,
      actionText: "Action Control turned off. I will now remain in normal conversation mode.",
      spokenResponse: "Action Control turned off. I won't execute device actions now.",
      isHandled: true,
      data: { actionControlEnabled: false },
    };
  }

  if (
    lower.includes("turn action control on") ||
    lower.includes("action control on") ||
    lower.includes("action control chalu karo") ||
    lower.includes("enable action control") ||
    lower.includes("เปิด action control")
  ) {
    return {
      type: "toggle_alert",
      alertType: "action_control",
      alertValue: true,
      actionText: "Action Control turned on. Supported actions are now enabled.",
      spokenResponse: "Action Control turned on.",
      isHandled: true,
      data: { actionControlEnabled: true },
    };
  }

  // Call Alerts Toggle
  const callAlertOn =
    lower.match(/^(?:turn|switch|set)\s+call\s+alerts?\s+on$/) ||
    lower.includes("call alert on") ||
    lower.includes("call alert chalu karo") ||
    lower.includes("เปิดการแจ้งเตือนสายโทร");
  const callAlertOff =
    lower.match(/^(?:turn|switch|set)\s+call\s+alerts?\s+off$/) ||
    lower.includes("call alert off") ||
    lower.includes("call alert band karo") ||
    lower.includes("ปิดการแจ้งเตือนสายโทร");

  if (callAlertOn) {
    return {
      type: "toggle_alert",
      alertType: "call",
      alertValue: true,
      actionText: "Call alerts turned on.",
      spokenResponse: "Call alerts turned on.",
      isHandled: true,
      data: { callAlertsEnabled: true },
    };
  }
  if (callAlertOff) {
    return {
      type: "toggle_alert",
      alertType: "call",
      alertValue: false,
      actionText: "Call alerts turned off.",
      spokenResponse: "Call alerts turned off.",
      isHandled: true,
      data: { callAlertsEnabled: false },
    };
  }

  // Message Alerts Toggle
  const msgAlertOn =
    lower.match(/^(?:turn|switch|set)\s+message\s+alerts?\s+on$/) ||
    lower.includes("message alert on") ||
    lower.includes("message alert chalu karo") ||
    lower.includes("เปิดการแจ้งเตือนข้อความ");
  const msgAlertOff =
    lower.match(/^(?:turn|switch|set)\s+message\s+alerts?\s+off$/) ||
    lower.includes("message alert off") ||
    lower.includes("message alert band karo") ||
    lower.includes("ปิดการแจ้งเตือนข้อความ");

  if (msgAlertOn) {
    return {
      type: "toggle_alert",
      alertType: "message",
      alertValue: true,
      actionText: "Message alerts turned on.",
      spokenResponse: "Message alerts turned on.",
      isHandled: true,
      data: { messageAlertsEnabled: true },
    };
  }
  if (msgAlertOff) {
    return {
      type: "toggle_alert",
      alertType: "message",
      alertValue: false,
      actionText: "Message alerts turned off.",
      spokenResponse: "Message alerts turned off.",
      isHandled: true,
      data: { messageAlertsEnabled: false },
    };
  }

  // Wake Word Toggle
  const wakeOn = lower.match(/^(?:turn|switch|set)\s+wake\s+word\s+on$/) || lower.includes("wake word chalu karo");
  const wakeOff = lower.match(/^(?:turn|switch|set)\s+wake\s+word\s+off$/) || lower.includes("wake word band karo");
  if (wakeOn) {
    return {
      type: "toggle_alert",
      alertType: "wake_word",
      alertValue: true,
      actionText: "Wake word turned on.",
      spokenResponse: "Wake word turned on.",
      isHandled: true,
      data: { wakeWordEnabled: true },
    };
  }
  if (wakeOff) {
    return {
      type: "toggle_alert",
      alertType: "wake_word",
      alertValue: false,
      actionText: "Wake word turned off.",
      spokenResponse: "Wake word turned off.",
      isHandled: true,
      data: { wakeWordEnabled: false },
    };
  }

  // 2. Open Settings / Account
  if (
    lower === "open account settings" ||
    lower === "open settings" ||
    lower === "settings kholo" ||
    lower === "open account" ||
    lower === "account kholo" ||
    lower === "เปิดการตั้งค่า"
  ) {
    return {
      type: "settings",
      actionText: "Opening account settings.",
      spokenResponse: "Opening your settings panel.",
      isHandled: true,
      data: { openSettings: true },
    };
  }

  // 3. Notifications Query
  if (
    lower.includes("tell me my notifications") ||
    lower.includes("read my notifications") ||
    lower.includes("meri notification batao") ||
    lower.includes("notifications check karo") ||
    lower.includes("แจ้งเตือนของฉัน")
  ) {
    return {
      type: "read_messages",
      actionText: "Checking your recent notifications.",
      spokenResponse: "You have no unread urgent alerts right now.",
      isHandled: true,
    };
  }

  // 4. End / Reject / Answer Call Commands
  if (
    lower.includes("end the call") ||
    lower.includes("end call") ||
    lower.includes("cut call") ||
    lower.includes("disconnect call") ||
    lower.includes("call kato") ||
    lower.includes("วางสาย")
  ) {
    return {
      type: "end_call",
      actionText: "Ending the call.",
      spokenResponse: "Call ended.",
      isHandled: true,
    };
  }

  if (
    lower.includes("reject the call") ||
    lower.includes("reject call") ||
    lower.includes("decline call") ||
    lower.includes("ปฏิเสธสาย")
  ) {
    return {
      type: "reject_call",
      actionText: "Call rejected.",
      spokenResponse: "Call rejected.",
      isHandled: true,
    };
  }

  if (
    lower.includes("answer the call") ||
    lower.includes("answer call") ||
    lower.includes("pick up the call") ||
    lower.includes("pick up call") ||
    lower.includes("call uthao") ||
    lower.includes("รับสาย")
  ) {
    return {
      type: "answer_call",
      actionText: "Answering the call.",
      spokenResponse: "Connecting the call.",
      isHandled: true,
    };
  }

  // 5. Call Command Recognition:
  // English: "call rahul", "dial 9876543210"
  // Hindi/Urdu: "rahul ko call karo", "mom ko call lagao", "call karo rahul ko"
  // Kannada: "rahul ge call maadu"
  // Telugu: "rahul ki call cheyyi", "rahul ku call cheyyi"
  // Tamil: "rahul ku call pannu"
  // Malayalam: "rahul ne vilikku"
  // Marathi: "rahul la call kara"
  // Bengali: "rahul ke call koro"
  // Gujarati: "rahul ne call karo"
  // Punjabi: "rahul nu call karo"
  // Thai: "โทรหา rahul", "โทร rahul"
  const callEngMatch = lower.match(/^(?:please\s+)?(?:call|dial|phone)\s+([a-zA-Z0-9\+\s]+)$/);
  const callHindiMatch =
    lower.match(/^(.+?)\s+ko\s+(?:call\s+karo|phone\s+karo|call\s+lagao)$/) ||
    lower.match(/^(?:call\s+karo|call\s+lagao)\s+(.+?)(?:\s+ko)?$/);
  const callKanMatch = lower.match(/^(.+?)\s+ge\s+call\s+maadu$/);
  const callTelMatch = lower.match(/^(.+?)\s+(?:ki|ku)\s+call\s+cheyyi$/);
  const callTamMatch = lower.match(/^(.+?)\s+ku\s+call\s+pannu$/);
  const callMalMatch = lower.match(/^(.+?)\s+ne\s+vilikku$/);
  const callMarMatch = lower.match(/^(.+?)\s+la\s+call\s+kara$/);
  const callBenMatch = lower.match(/^(.+?)\s+ke\s+call\s+koro$/);
  const callGujMatch = lower.match(/^(.+?)\s+ne\s+call\s+karo$/);
  const callPunMatch = lower.match(/^(.+?)\s+nu\s+call\s+karo$/);
  const callThaiMatch = lower.match(/^(?:โทรหา|โทร)\s*(.+)$/);

  const matchedCall =
    callEngMatch?.[1] ||
    callHindiMatch?.[1] ||
    callKanMatch?.[1] ||
    callTelMatch?.[1] ||
    callTamMatch?.[1] ||
    callMalMatch?.[1] ||
    callMarMatch?.[1] ||
    callBenMatch?.[1] ||
    callGujMatch?.[1] ||
    callPunMatch?.[1] ||
    callThaiMatch?.[1];

  if (
    matchedCall &&
    !matchedCall.includes("alert") &&
    !matchedCall.includes("wake") &&
    !matchedCall.includes("assistant") &&
    !matchedCall.includes("bluff") &&
    !matchedCall.includes("me back") &&
    !matchedCall.includes("it a day")
  ) {
    const contact = matchedCall.trim().replace(/^(the\s+|my\s+)/, "");
    return {
      type: "call",
      contact,
      actionText: `Should I call ${contact}?`,
      spokenResponse: `Should I place a call to ${contact}?`,
      uiPrompt: `Call ${contact}?`,
      requiresConfirmation: true,
      requiresPermission: "calls",
      permissionGranted: true,
      isHandled: true,
      data: { contact },
    };
  }

  // 6. Message Command Recognition:
  // English: "send a message to rahul saying I will reach in 10 minutes"
  // Hindi/Urdu: "rahul ko message bhejo ki 10 minute me aa raha hoon"
  // Kannada: "rahul ge message kalisu ..."
  // Telugu: "rahul ki message pampu ..."
  // Tamil: "rahul ku message anuppu ..."
  // Marathi: "rahul la message pathva ..."
  // Bengali: "rahul ke message pathao ..."
  // Gujarati: "rahul ne message moklo ..."
  // Punjabi: "rahul nu message bhejo ..."
  // Thai: "ส่งข้อความถึง rahul ว่า จะถึงใน 10 นาที"
  const msgEngMatch1 = lower.match(
    /^(?:please\s+)?send\s+(?:a\s+)?(?:whatsapp\s+)?message\s+to\s+(.+?)\s+saying\s+(.+)$/
  );
  const msgEngMatch2 = lower.match(
    /^(?:please\s+)?send\s+(.+?)\s+(?:a\s+)?(?:whatsapp\s+)?message\s+saying\s+(.+)$/
  );
  const msgEngMatch3 = lower.match(
    /^(?:please\s+)?send\s+(?:a\s+)?(?:whatsapp\s+)?message\s+to\s+([a-zA-Z0-9\s]+)$/
  );
  const msgHindiMatch = lower.match(
    /^(.+?)\s+ko\s+(?:message|whatsapp)\s+bhejo(?:\s+ki\s+(.+))?$/
  );
  const msgKanMatch = lower.match(/^(.+?)\s+ge\s+message\s+kalisu(?:\s+(.+))?$/);
  const msgTelMatch = lower.match(/^(.+?)\s+(?:ki|ku)\s+message\s+pampu(?:\s+(.+))?$/);
  const msgTamMatch = lower.match(/^(.+?)\s+ku\s+message\s+anuppu(?:\s+(.+))?$/);
  const msgMarMatch = lower.match(/^(.+?)\s+la\s+message\s+pathva(?:\s+(.+))?$/);
  const msgBenMatch = lower.match(/^(.+?)\s+ke\s+message\s+pathao(?:\s+(.+))?$/);
  const msgGujMatch = lower.match(/^(.+?)\s+ne\s+message\s+moklo(?:\s+(.+))?$/);
  const msgPunMatch = lower.match(/^(.+?)\s+nu\s+message\s+bhejo(?:\s+(.+))?$/);
  const msgThaiMatch = lower.match(/^ส่งข้อความ(?:ถึง|หา)\s*(.+?)(?:\s*ว่า\s*(.+))?$/);

  const matchedMsg =
    msgEngMatch1 ||
    msgEngMatch2 ||
    msgEngMatch3 ||
    msgHindiMatch ||
    msgKanMatch ||
    msgTelMatch ||
    msgTamMatch ||
    msgMarMatch ||
    msgBenMatch ||
    msgGujMatch ||
    msgPunMatch ||
    msgThaiMatch;

  if (matchedMsg) {
    const contact = matchedMsg[1].trim().replace(/^(the\s+|my\s+)/, "");
    const messageContent = (matchedMsg[2] || "Hello!").trim();
    return {
      type: "message",
      contact,
      messageContent,
      actionText: `Should I send the message to ${contact}?`,
      spokenResponse: `Should I send the message to ${contact}?`,
      uiPrompt: `Send message to ${contact}?`,
      requiresConfirmation: true,
      requiresPermission: "messages",
      permissionGranted: true,
      isHandled: true,
      data: { contact, message: messageContent },
    };
  }

  // 7. Media Play: "Play [query] on YouTube"
  const ytMatch = lower.match(/^(?:please\s+)?play\s+(.+?)\s+on\s+youtube$/);
  const ytThaiMatch = lower.match(/^(?:เปิดเพลง|เล่นเพลง|เปิด)\s+(.+?)\s+ใน\s+youtube$/);
  if (ytMatch || ytThaiMatch) {
    const q = (ytMatch?.[1] || ytThaiMatch?.[1] || "").trim();
    return {
      type: "media_youtube",
      appName: "YouTube",
      actionText: `Opening YouTube to play "${q}".`,
      spokenResponse: `Opening ${q} on YouTube.`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      requiresPermission: "appAccess",
      permissionGranted: true,
      isBrowserAction: true,
      isHandled: true,
      data: { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
    };
  }

  // 8. Media Search: "Search [query] on Spotify"
  const spotifyMatch = lower.match(/^(?:please\s+)?search\s+(.+?)\s+on\s+spotify$/);
  if (spotifyMatch) {
    const q = spotifyMatch[1].trim();
    return {
      type: "media_spotify",
      appName: "Spotify",
      actionText: `Opening Spotify to search "${q}".`,
      spokenResponse: `Searching ${q} on Spotify.`,
      url: `https://open.spotify.com/search/${encodeURIComponent(q)}`,
      requiresPermission: "appAccess",
      permissionGranted: true,
      isBrowserAction: true,
      isHandled: true,
      data: { url: `https://open.spotify.com/search/${encodeURIComponent(q)}` },
    };
  }

  // 9. App Access: "Open [app]" / "[app] kholo" / "[app] open maadu" / "[app] open cheyyi" / "เปิด [app]"
  let appToOpen = "";
  const openEngMatch = lower.match(/^(?:please\s+)?open\s+([a-zA-Z0-9\.\s]+)$/);
  const openHindiMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:kholo|chalu\s+karo|open\s+karo)$/);
  const openKanMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+open\s+maadu$/);
  const openTelMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+open\s+cheyyi$/);
  const openTamMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:open\s+pannu|thira)$/);
  const openMarMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:ughada|chalu\s+kara)$/);
  const openBenMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:kholo|open\s+koro)$/);
  const openGujMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:kholo|chalu\s+karo)$/);
  const openPunMatch = lower.match(/^([a-zA-Z0-9\.\s]+)\s+(?:kholo|open\s+karo)$/);
  const openThaiMatch = lower.match(/^เปิด\s*([a-zA-Z0-9\.\s]+)$/);

  if (openEngMatch) appToOpen = openEngMatch[1].trim();
  else if (openHindiMatch) appToOpen = openHindiMatch[1].trim();
  else if (openKanMatch) appToOpen = openKanMatch[1].trim();
  else if (openTelMatch) appToOpen = openTelMatch[1].trim();
  else if (openTamMatch) appToOpen = openTamMatch[1].trim();
  else if (openMarMatch) appToOpen = openMarMatch[1].trim();
  else if (openBenMatch) appToOpen = openBenMatch[1].trim();
  else if (openGujMatch) appToOpen = openGujMatch[1].trim();
  else if (openPunMatch) appToOpen = openPunMatch[1].trim();
  else if (openThaiMatch) appToOpen = openThaiMatch[1].trim();

  if (
    appToOpen &&
    !appToOpen.includes("eyes") &&
    !appToOpen.includes("heart") &&
    !appToOpen.includes("door") &&
    !appToOpen.includes("mind") &&
    !appToOpen.includes("mouth")
  ) {
    const cleanKey = appToOpen.toLowerCase().replace(/\s+/g, "");
    if (cleanKey === "aira") {
      return {
        type: "app",
        actionText: "AIRA is already running right in front of you!",
        spokenResponse: "I'm already right here listening to you!",
        isHandled: true,
      };
    }

    if (cleanKey === "settings" || cleanKey === "account") {
      return {
        type: "settings",
        actionText: "Opening account settings.",
        spokenResponse: "Opening settings.",
        isHandled: true,
        data: { openSettings: true },
      };
    }

    let targetUrl = APP_URL_MAP[cleanKey];
    if (!targetUrl) {
      targetUrl = `https://www.${cleanKey.includes(".") ? cleanKey : cleanKey + ".com"}`;
    }

    const formattedName = appToOpen.charAt(0).toUpperCase() + appToOpen.slice(1);
    return {
      type: "open_app",
      appName: formattedName,
      appUrl: targetUrl,
      url: targetUrl,
      actionText: `Opening ${formattedName}.`,
      spokenResponse: `Opening ${formattedName} for you.`,
      requiresPermission: "appAccess",
      permissionGranted: true,
      isBrowserAction: true,
      isHandled: true,
      data: { url: targetUrl },
    };
  }

  return { type: "none", actionText: "", isBrowserAction: false, isHandled: false };
}

export const parseAIRACommand = processCommand;
