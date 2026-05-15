"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import { getAdminSettings, updateAdminSettings } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { AdminSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    allow_already_paid: false,
    payment_mode: "razorpay",
    admin_upi_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });

  useEffect(() => {
    const token = getClientToken();
    if (!token) return;

    getAdminSettings(token)
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        setToast({ open: true, message: err.message, variant: "error" });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const token = getClientToken();
    if (!token) return;

    setSaving(true);
    try {
      await updateAdminSettings(token, settings);
      setToast({ open: true, message: "Settings updated successfully", variant: "success" });
    } catch (err: any) {
      setToast({ open: true, message: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">⚙️ General Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Configure platform-wide behavior and payment integrations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Settings */}
        <section className="glass-surface rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>💳</span> Payment Configuration
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Payment Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, payment_mode: "razorpay" })}
                  className={`rounded-xl p-3 border text-sm font-medium transition-all ${
                    settings.payment_mode === "razorpay"
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg"
                      : "bg-transparent border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  Razorpay (Automated)
                </button>
                <button
                  onClick={() => setSettings({ ...settings, payment_mode: "upi" })}
                  className={`rounded-xl p-3 border text-sm font-medium transition-all ${
                    settings.payment_mode === "upi"
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg"
                      : "bg-transparent border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  UPI (Manual)
                </button>
              </div>
            </div>

            {settings.payment_mode === "upi" && (
              <div className="flex flex-col gap-2 animate-slide-up">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Admin UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. yourname@upi"
                  value={settings.admin_upi_id}
                  onChange={(e) => setSettings({ ...settings, admin_upi_id: e.target.value })}
                  className="rounded-xl border border-[var(--glass-border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Users will be shown this UPI ID and a generated QR code for payments.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Feature Toggles */}
        <section className="glass-surface rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>🚀</span> Feature Management
          </h2>
          
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Manual Payment Option</p>
              <p className="text-xs text-[var(--text-muted)]">Show "I've already paid" button to users</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allow_already_paid: !settings.allow_already_paid })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.allow_already_paid ? "bg-[var(--accent)]" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.allow_already_paid ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <NeuButton onClick={handleSave} loading={saving} className="w-full sm:w-auto px-12">
            Save Settings
          </NeuButton>
        </div>
      </div>

      <NeuToast
        message={toast.message}
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
