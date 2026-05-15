"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { NeuCheckbox } from "@/components/ui/NeuCheckbox";
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
      setMessage("Account established.");
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
    <>
      <div className="brutalist-card animate-fade-in w-full max-w-md p-8 md:p-12 mx-auto space-y-10 bg-white">
        {/* Header */}
        <div className="text-center space-y-2">
           <h1 className="text-5xl font-['Anton'] uppercase tracking-tighter">Registration</h1>
           <p className="font-['Bebas_Neue'] text-xl text-gray-500 uppercase tracking-widest">Enlist in the Protocol</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <NeuInput
            type="email"
            label="Email Identifier"
            placeholder="AGENT@DOMAIN.COM"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          <NeuInput
            type="password"
            label="Security Key"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <div className="pt-2">
             <NeuCheckbox
               checked={agreed}
               onChange={setAgreed}
               label="I accept the Terms of Engagement and Privacy Protocols"
             />
          </div>

          <div className="pt-4">
             <NeuButton 
               type="submit" 
               className="w-full text-xl" 
               loading={loading} 
               disabled={!agreed}
               variant="primary"
             >
               Initialize Account →
             </NeuButton>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-8 border-t-2 border-black text-center space-y-4">
           <p className="font-['Inter'] text-sm uppercase tracking-tight font-medium">Existing Personnel?</p>
           <Link href="/login">
              <button className="brutalist-button secondary w-full text-lg">Access Terminal</button>
           </Link>
        </div>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </>
  );
}
