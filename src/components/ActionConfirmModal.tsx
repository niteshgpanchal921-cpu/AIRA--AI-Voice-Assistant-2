import React from "react";
import { Phone, MessageSquare, ExternalLink, Bell, X, Check, PhoneCall, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface PendingAction {
  id: string;
  type: "call" | "message" | "open_app" | "call_alert" | "message_alert";
  title: string;
  description: string;
  details?: {
    contact?: string;
    messageText?: string;
    appName?: string;
    url?: string;
  };
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ActionConfirmModalProps {
  action: PendingAction | null;
  onClose: () => void;
}

export default function ActionConfirmModal({ action, onClose }: ActionConfirmModalProps) {
  if (!action) return null;

  const getIcon = () => {
    switch (action.type) {
      case "call":
      case "call_alert":
        return <Phone className="text-emerald-400" size={24} />;
      case "message":
      case "message_alert":
        return <MessageSquare className="text-cyan-400" size={24} />;
      case "open_app":
        return <ExternalLink className="text-purple-400" size={24} />;
      default:
        return <Bell className="text-cyan-400" size={24} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          className="relative w-full max-w-md bg-[#0d0d12]/95 border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden"
        >
          {/* Subtle glowing accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close / Dismiss */}
          <button
            onClick={() => {
              action.onCancel();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-400">
                AIRA {action.type.replace("_", " ").toUpperCase()}
              </span>
              <h3 className="text-lg font-medium text-white tracking-tight">{action.title}</h3>
            </div>
          </div>

          {/* Body Description */}
          <p className="text-sm text-white/70 mb-5 leading-relaxed font-sans">{action.description}</p>

          {/* Additional details if message */}
          {action.details?.messageText && (
            <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-cyan-200/90 italic">
              "{action.details.messageText}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                action.onCancel();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 font-medium transition-colors"
            >
              {action.cancelLabel || "Cancel"}
            </button>
            <button
              onClick={() => {
                action.onConfirm();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
            >
              <Check size={14} />
              {action.confirmLabel || "Confirm"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
