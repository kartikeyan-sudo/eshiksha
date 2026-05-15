"use client";

import { useEffect, useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuModal } from "@/components/ui/NeuModal";
import { formatINR } from "@/lib/utils";

type UpiPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (utr: string) => void;
  upiId: string;
  amount: number;
  ebookTitle: string;
  loading?: boolean;
};

export function UpiPaymentModal({
  open,
  onClose,
  onSubmit,
  upiId,
  amount,
  ebookTitle,
  loading,
}: UpiPaymentModalProps) {
  const [utr, setUtr] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (!open) {
      setTimeLeft(600);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const upiUrl = `upi://pay?pa=${upiId}&pn=EShikhsha&am=${amount}&cu=INR&tn=Purchase ${ebookTitle}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const handleSubmit = () => {
    if (utr.trim().length < 6) return;
    onSubmit(utr.trim());
  };

  return (
    <NeuModal open={open} onClose={onClose} title="Pay via UPI">
      <div className="space-y-6 mt-4">
        {/* Timer */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] text-sm font-bold w-fit mx-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Session expires in: {formatTime(timeLeft)}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-6 glass-surface rounded-2xl border-2 border-[var(--accent)]/30">
          <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 rounded-lg shadow-xl mb-4 bg-white p-2" />
          <p className="text-sm font-bold text-[var(--text-primary)]">{formatINR(amount)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{upiId}</p>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1">
          <p className="text-sm text-[var(--text-primary)] font-medium">Scan the QR code to pay</p>
          <p className="text-xs text-[var(--text-muted)]">After payment, enter your 12-digit UTR number below</p>
        </div>

        {/* UTR Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1 uppercase tracking-wider">UTR Number / Transaction ID</label>
          <input
            type="text"
            placeholder="Enter 12-digit UTR"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-4 py-3 text-center text-lg font-bold tracking-[0.2em] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-all placeholder:text-[var(--text-muted)]/30 placeholder:tracking-normal placeholder:font-normal"
          />
        </div>

        <NeuButton
          onClick={handleSubmit}
          loading={loading}
          disabled={utr.length < 6}
          className="w-full py-4 font-bold"
        >
          Submit Payment Details
        </NeuButton>

        <p className="text-[10px] text-center text-[var(--text-muted)] px-4">
          By clicking submit, you agree that your payment will be manually verified by our team. Access will be granted once verification is complete.
        </p>
      </div>
    </NeuModal>
  );
}
