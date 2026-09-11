import React from "react";
import { Phone, MessageSquare, X, PhoneCall, PhoneOff } from "lucide-react";

export interface IncomingAlert {
  id: string;
  type: "call" | "message";
  sender: string;
  preview?: string;
}

interface IncomingAlertBannerProps {
  alert: IncomingAlert;
  onAnswer?: () => void;
  onReject?: () => void;
  onDismiss: () => void;
}

export default function IncomingAlertBanner({
  alert,
  onAnswer,
  onReject,
  onDismiss,
}: IncomingAlertBannerProps) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-bounce-in">
      <div className={`p-4 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center justify-between gap-3 ${
        alert.type === "call"
          ? "bg-pink-950/85 border-pink-500/40 text-pink-50 shadow-pink-500/20"
          : "bg-violet-950/85 border-violet-500/40 text-violet-50 shadow-violet-500/20"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            alert.type === "call"
              ? "bg-pink-500/20 text-pink-300 animate-pulse"
              : "bg-violet-500/20 text-violet-300"
          }`}>
            {alert.type === "call" ? <Phone size={20} /> : <MessageSquare size={20} />}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">
              {alert.type === "call" ? "Incoming Call Alert" : "Message Alert"}
            </div>
            <div className="text-xs md:text-sm font-semibold truncate">
              {alert.sender}
            </div>
            {alert.preview && (
              <div className="text-[11px] opacity-80 truncate max-w-xs">
                "{alert.preview}"
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {alert.type === "call" ? (
            <>
              <button
                onClick={onReject}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors"
                title="Reject Call"
              >
                <PhoneOff size={16} />
              </button>
              <button
                onClick={onAnswer}
                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                title="Answer Call"
              >
                <PhoneCall size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
