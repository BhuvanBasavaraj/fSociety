"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; // <-- THE BRIDGE

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const VIGILANTE_PREFIXES = ["cipher", "null", "ghost", "phantom", "root", "proxy", "zero", "void"];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [username, setUsername] = useState("");
  
  // NEW: State to track what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateUsername = () => {
    const prefix = VIGILANTE_PREFIXES[Math.floor(Math.random() * VIGILANTE_PREFIXES.length)];
    const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    setUsername(`${prefix}_${hex}`);
  };

  // NEW: The function that talks to Supabase
  const handleAuth = async () => {
    if (authMethod !== "email") {
      alert("SYSTEM NOTICE: Phone OTP requires Twilio integration. Using Email for current protocol.");
      setAuthMethod("email");
      return;
    }

    if (!email || !password) {
      alert("ERROR: Credentials missing.");
      return;
    }

    setIsLoading(true);

    if (mode === "signup") {
      // 1. Send data to Supabase Auth to create a new user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { username: username || "anonymous" } // Save the vigilante name in the database!
        }
      });

      if (error) {
        alert("ENLISTMENT FAILED: " + error.message);
      } else {
        alert("ENLISTMENT SUCCESSFUL! You are now in the system.");
        setMode("login"); // Switch them to login mode to enter
      }
    } else {
      // 2. Verify credentials to log in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        alert("DECRYPTION FAILED: " + error.message);
      } else {
        // Success! Send them to the dashboard
        router.push("/board");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className={`${mono.variable} ${sans.variable} flex min-h-screen items-center justify-center bg-black p-4 font-sans text-zinc-300 selection:bg-[#E4FF00] selection:text-black`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#E4FF00] opacity-[0.03] blur-[100px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 w-full max-w-md border border-white/10 bg-black/80 p-8 backdrop-blur-xl shadow-2xl">
        
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none border border-white/10 bg-white/[0.02]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_15px_rgba(228,255,0,0.8)]">
              <path d="M12 2L22 22H2L12 2Z" fill="#E4FF00" />
              <circle cx="12" cy="15" r="3" fill="#000000" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-white">fSociety</h1>
          <p className="mt-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            {mode === "login" ? "Identity Verification Required" : "Initiate Enlistment Protocol"}
          </p>
        </header>

        <div className="mb-8 flex rounded-none border border-white/10 bg-white/[0.02] p-1 font-mono text-[10px] tracking-widest">
          <button onClick={() => setMode("login")} className={`flex-1 py-2.5 transition-all ${mode === "login" ? "bg-[#E4FF00] text-black font-bold shadow-[0_0_10px_rgba(228,255,0,0.3)]" : "text-zinc-500 hover:text-white"}`}>LOGIN</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2.5 transition-all ${mode === "signup" ? "bg-[#E4FF00] text-black font-bold shadow-[0_0_10px_rgba(228,255,0,0.3)]" : "text-zinc-500 hover:text-white"}`}>ENLIST</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mode === "login" ? 10 : -10 }} transition={{ duration: 0.2 }}>
            
            {mode === "signup" && (
              <div className="mb-6 border-l-2 border-red-500 bg-red-500/10 p-3 text-[10px] font-mono leading-relaxed text-red-200">
                <span className="font-bold text-red-400">WARNING:</span> Your identity is mathematically encrypted and preserved. However, malicious actions against the collective will result in immediate de-anonymization.
              </div>
            )}

            <div className="flex flex-col gap-4">
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 tracking-[0.2em] font-mono uppercase">Vigilante Alias</label>
                  <div className="flex gap-2">
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. cipher_8F2A" className="flex-1 bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-[#E4FF00] font-mono focus:border-[#E4FF00] focus:outline-none" />
                    <button onClick={generateUsername} type="button" className="border border-white/10 bg-white/[0.03] px-3 hover:bg-white/10 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.84-10.36L2 8"/></svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-zinc-500 tracking-[0.2em] font-mono uppercase">
                    {authMethod === "email" ? "Email Address" : "Phone Number (OTP)"}
                  </label>
                  <button onClick={() => setAuthMethod(authMethod === "email" ? "phone" : "email")} className="text-[9px] text-[#E4FF00] hover:underline font-mono uppercase tracking-wider">
                    Use {authMethod === "email" ? "Phone" : "Email"} instead
                  </button>
                </div>
                {/* NEW: Bound input to state */}
                <input 
                  type={authMethod === "email" ? "email" : "tel"} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authMethod === "email" ? "secure@proton.me" : "+1 (555) 000-0000"} 
                  className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all" 
                />
              </div>

              {authMethod === "email" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 tracking-[0.2em] font-mono uppercase">Passphrase</label>
                  {/* NEW: Bound input to state */}
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all" 
                  />
                </div>
              )}

              {/* NEW: Bound button to handleAuth function */}
              <button onClick={handleAuth} disabled={isLoading} className="mt-2 w-full bg-[#E4FF00] py-3 text-[11px] font-bold tracking-[0.2em] text-black font-mono hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 disabled:opacity-50">
                {isLoading ? "PROCESSING..." : (mode === "login" ? (authMethod === "email" ? "DECRYPT & ENTER" : "SEND OTP CODE") : "INITIALIZE PROTOCOL")}
              </button>
            </div>
            
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[9px] font-mono tracking-widest text-zinc-600 uppercase">OR OAUTH</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button onClick={() => alert("Google OAuth requires configuring GCP credentials. We'll set this up later!")} className="flex w-full items-center justify-center gap-3 border border-white/10 bg-white/[0.02] py-2.5 text-[11px] font-mono tracking-widest text-zinc-300 transition-all hover:bg-white/10">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              CONTINUE WITH GOOGLE
            </button>

          </motion.div>
        </AnimatePresence>
        
        <div className="mt-8 text-center">
          <Link href="/board" className="text-[10px] font-mono tracking-widest text-zinc-600 hover:text-[#E4FF00] transition-colors underline decoration-white/20 underline-offset-4">
            RETURN TO PUBLIC BOARD
          </Link>
        </div>
      </motion.div>
    </div>
  );
}