"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateThreadModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-mono">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Box - Now TRUE BLACK with subtle white border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg border border-white/10 bg-black p-8 shadow-2xl"
          >
            <header className="mb-6 border-b border-white/10 pb-4">
              {/* Tight, sans-serif typography like motion.dev */}
              <h2 className="text-xl tracking-tight font-sans text-[#E4FF00] font-semibold">Open New Thread</h2>
              <p className="mt-1 text-xs text-red-400 font-mono uppercase tracking-widest">Warning: All metadata will be scrubbed.</p>
            </header>

            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Thread Title</label>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans"
                  placeholder="Summarize the core issue..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Channel</label>
                <select className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans">
                  <option className="bg-black">/s/tech-leaks</option>
                  <option className="bg-black">/s/rent-watch</option>
                  <option className="bg-black">/s/supply-chain</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Initial Evidence</label>
                <textarea 
                  rows={5}
                  className="w-full bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-[#E4FF00] focus:shadow-[0_0_10px_rgba(228,255,0,0.2)] focus:outline-none transition-all font-sans resize-none"
                  placeholder="Detail the systemic issue here. Be precise."
                />
              </div>

              <footer className="mt-2 flex justify-end gap-4 border-t border-white/10 pt-6">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                {/* GLOWING BUTTON EFFECT */}
                <button 
                  type="button"
                  className="bg-[#E4FF00] px-6 py-2 text-xs font-bold tracking-widest text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300"
                >
                  ENCRYPT & SUBMIT
                </button>
              </footer>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}