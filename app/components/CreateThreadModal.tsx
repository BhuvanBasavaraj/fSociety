"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// 1. UPDATE: Tell TypeScript the author is now required to send data back up
interface NewThreadData {
  title: string;
  channel: string;
  excerpt: string;
  author: string; 
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewThreadData) => void;
}

export default function CreateThreadModal({ isOpen, onClose, onSubmit }: ModalProps) {
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("tech-leaks");
  const [excerpt, setExcerpt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !excerpt.trim()) {
      alert("SYSTEM HALT: You must provide both a Thread Title and Initial Evidence.");
      return;
    }

    setIsSubmitting(true);

    const randomHex = () => Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    const generatedId = `${randomHex()}-${randomHex()}`;

    // 2. UPDATE: The new Try/Catch block that grabs the user's alias!
    try {
      // Get the securely authenticated user from the local session
      const { data: { user } } = await supabase.auth.getUser();
      
      // Extract their vigilante alias (or fallback to anonymous if something fails)
      const vigilanteAlias = user?.user_metadata?.username || "anonymous";

      // Fire the data into your real PostgreSQL database with the author!
      const { error } = await supabase
        .from('threads')
        .insert([
          {
            id: generatedId,
            title: title,
            channel: channel,
            excerpt: excerpt,
            author: vigilanteAlias
          }
        ]);

      if (error) throw error;

      // Update the frontend feed so it feels instant, passing the alias back up
      onSubmit({ title, channel, excerpt, author: vigilanteAlias });

      setTitle("");
      setExcerpt("");
      onClose();
    } catch (err: any) {
      alert("NETWORK FAILURE: Could not encrypt to database. " + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-mono p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg border border-white/10 bg-black p-8 shadow-2xl z-10">
            
            <header className="mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl tracking-tight font-sans text-[#E4FF00] font-semibold">Open New Thread</h2>
              <p className="mt-1 text-xs text-red-400 font-mono uppercase tracking-widest">Warning: All metadata will be scrubbed.</p>
            </header>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Thread Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans" placeholder="Summarize the core issue..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full bg-black border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans">
                  <option value="tech-leaks">/s/tech-leaks</option>
                  <option value="rent-watch">/s/rent-watch</option>
                  <option value="wage-theft">/s/wage-theft</option>
                  <option value="supply-chain">/s/supply-chain</option>
                  <option value="open-source-intel">/s/open-source-intel</option>
                  <option value="the-basement">/s/the-basement</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Initial Evidence / Report</label>
                <textarea rows={4} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans resize-none" placeholder="Detail the systemic issue here. Be precise." />
              </div>

              <footer className="mt-2 flex justify-end gap-4 border-t border-white/10 pt-6">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold tracking-widest text-zinc-500 hover:text-white transition-colors">CANCEL</button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-[#E4FF00] px-6 py-2 text-xs font-bold tracking-widest text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 disabled:opacity-50">
                  {isSubmitting ? "ENCRYPTING..." : "ENCRYPT & SUBMIT"}
                </button>
              </footer>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}