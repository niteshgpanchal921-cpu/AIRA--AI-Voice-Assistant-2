import React from "react";
import { Phone, MessageSquare, ExternalLink, ShieldCheck, X, Check } from "lucide-react";

export type DialogActionType = "call" | "message" | "app" | "permission_call" | "permission_message";

export interface ActionConfirmDialogProps {
  type: DialogActionType;
  title: string;
  description: string;
  previewContent?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ActionConfirmDialog({
  type,
  title,
  description,
  previewContent,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ActionConfirmDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "call":
      case "permission_call":
        return <Phone className="text-pink-400" size={24} />;
      case "message":
      case "permission_message":
        return <MessageSquare className="text-violet-400" size={24} />;
      case "app":
        return <ExternalLink className="text-cyan-400" size={24} />;
      default:
        return <ShieldCheck className="text-cyan-400" size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#121218] border border-cyan-500/30 rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Close icon */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2 mt-1">
          <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 shadow-inner">
            {getIcon()}
          </div>
          <h3 className="text-sm md:text-base font-semibold text-white tracking-wide">
            {title}
          </h3>
          <p className="text-xs text-white/70 leading-relaxed max-w-xs">
            {description}
          </p>
        </div>

        {/* Preview Content (e.g. Message Text) */}
        {previewContent && (
          <div className="mt-3.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-100 font-mono italic text-left max-h-24 overflow-y-auto">
            "{previewContent}"
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Check size={14} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
