"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";
import { NeuToast } from "@/components/ui/NeuToast";

export function SignupForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setLoading(true);

    try {
      const response = await registerUser(email, password);
      setClientAuth(response.token, response.user.role);
      setToastVariant("success");
      setMessage("Account created successfully");
      setToast(true);
      router.replace("/");
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Registration failed");
      setToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="glass-panel p-12 rounded-[3rem] space-y-10 animate-slide-up">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white">JOIN THE ELITE</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Start your transformation journey</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Email Address</label>
            <input
              type="email"
              placeholder="you@mastery.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 px-4">
             <input 
              type="checkbox" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
             />
             <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                I agree to the Terms of Service
             </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || !agreed}
            className="w-full py-5 rounded-full bg-white text-black font-black uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs font-medium text-white/30">
            Already in the circle?{" "}
            <Link href="/login" className="text-white font-black hover:text-blue-400 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </div>
  );
}
