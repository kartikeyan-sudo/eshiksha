"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { login } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(email, password);
      setClientAuth(data.token, data.role);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Security verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md brutalist-card p-8 md:p-12 space-y-10 animate-fade-in">
        <div className="text-center space-y-2">
           <h1 className="text-5xl font-['Anton'] uppercase tracking-tighter">Access Terminal</h1>
           <p className="font-['Bebas_Neue'] text-xl text-gray-500 uppercase tracking-widest">Identify Yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
           <NeuInput
             label="Email Identifier"
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             placeholder="IDENTITY@DOMAIN.COM"
           />
           <NeuInput
             label="Security Key"
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             placeholder="••••••••"
           />

           {error && (
             <div className="p-4 border-2 border-red-600 bg-red-50 text-red-600 font-['Inter'] font-bold text-sm uppercase">
               ERROR: {error}
             </div>
           )}

           <div className="pt-4">
              <NeuButton 
                type="submit" 
                variant="primary" 
                className="w-full"
                loading={loading}
              >
                Establish Link →
              </NeuButton>
           </div>
        </form>

        <div className="pt-8 border-t-2 border-black text-center space-y-4">
           <p className="font-['Inter'] text-sm uppercase tracking-tight font-medium">New Protocol Agent?</p>
           <Link href="/signup">
              <button className="brutalist-button accent w-full text-lg">Initialize Registration</button>
           </Link>
        </div>
      </div>
    </div>
  );
}
