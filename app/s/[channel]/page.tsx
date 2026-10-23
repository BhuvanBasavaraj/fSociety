"use client";

// We import React things
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

// We import UI styling things
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { motion, MotionConfig, type Variants } from "framer-motion";

// We import our custom Modal and our Supabase bridge
import CreateThreadModal from "@/app/components/CreateThreadModal";
import { supabase } from "@/lib/supabase";


const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const YELLOW = "#E4FF00";
const BG = "#000000";

/* ------------------------------------------------------------------ */
/* Data Types & Constants                                             */
/* ------------------------------------------------------------------ */

const CHANNELS = [
  { href: "/s/tech-leaks", label: "tech-leaks", live: 128 },
  { href: "/s/rent-watch", label: "rent-watch", live: 94 },
  { href: "/s/wage-theft", label: "wage-theft", live: 61 },
  { href: "/s/supply-chain", label: "supply-chain", live: 47 },
  { href: "/s/open-source-intel", label: "open-source-intel", live: 33 },
  { href: "/s/the-basement", label: "the-basement", live: 12 },
];

type Thread = {
  id: string;
  channel: string;
  title: string;
  excerpt: string;
  ttlMinutes: number;
  contributors: number;
  replies: number;
  heat: 1 | 2 | 3 | 4 | 5;
  ageMinutes: number;
  restricted?: boolean;
};

const SORTS = [
  { key: "hot", label: "HOT" },
  { key: "new", label: "NEW" },
  { key: "expiring", label: "EXPIRING" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Helpers & Motion                                                   */
/* ------------------------------------------------------------------ */

const fmtTtl = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
const fmtAge = (m: number) => (m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`);
const pad = (n: number) => String(n).padStart(2, "0");
const fmtClock = (s: number) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const EASE = [0.22, 1, 0.36, 1] as const;
const feedVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const cardVariants: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

/* ------------------------------------------------------------------ */
/* Repeated Components (Would normally put these in separate files!)  */
/* ------------------------------------------------------------------ */

function Logo() {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_10px_rgba(228,255,0,0.8)]">
        <path d="M12 2L22 22H2L12 2Z" fill="#E4FF00" />
        <circle cx="12" cy="15" r="3" fill="#000000" />
      </svg>
      <span className="text-lg font-sans font-bold tracking-tighter text-white">fSociety</span>
    </div>
  );
}

function NavLink({ href, label, live, active }: { href: string; label: string; live?: number; active?: boolean }) {
  return (
    <Link href={href} className={`group relative flex items-center justify-between py-2.5 pl-6 pr-4 text-[13px] outline-none transition-colors ${active ? "bg-white/[0.04] text-white" : "text-zinc-500 hover:text-white"}`}>
      <span aria-hidden className={`absolute left-0 top-0 h-full w-[2px] origin-center bg-[#E4FF00] shadow-[0_0_10px_rgba(228,255,0,0.7)] transition-transform duration-200 group-hover:scale-y-100 ${active ? "scale-y-100" : "scale-y-0"}`} />
      <span className="flex items-center gap-2">{label}</span>
      {live !== undefined && <span className="text-[11px] tabular-nums text-zinc-600 transition-colors group-hover:text-[#E4FF00]">{live}</span>}
    </Link>
  );
}

function LeftSidebar() {
  const pathname = usePathname();
  return (
    <motion.aside initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }} className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black lg:flex">
      <Logo />
      <nav aria-label="Channels" className="flex-1 overflow-y-auto py-6">
        <p className="px-6 pb-3 text-[10px] tracking-[0.25em] text-zinc-600 font-mono">CHANNELS</p>
        <NavLink href="/board" label="all-channels" active={pathname === "/board"} />
        <div className="my-4 mx-6 border-t border-white/10" />
        {CHANNELS.map((c) => <NavLink key={c.href} href={c.href} label={`/s/${c.label}`} live={c.live} active={pathname === c.href} />)}
      </nav>
      <div className="border-t border-white/10 p-6">
        <Link href="/" className="block w-full border border-white/10 py-2.5 text-center text-[10px] font-mono tracking-[0.25em] text-zinc-500 transition-all hover:border-[#E4FF00] hover:text-[#E4FF00] hover:shadow-[0_0_15px_rgba(228,255,0,0.15)]">TERMINATE</Link>
      </div>
    </motion.aside>
  );
}

function ThreadCard({ t }: { t: Thread }) {
  const urgent = t.ttlMinutes < 120;
  return (
    <motion.article layout variants={cardVariants} className="group relative border border-white/10 bg-white/[0.01] transition-all duration-300 hover:border-[#E4FF00]/50 hover:bg-white/[0.03] hover:shadow-[0_4px_30px_rgba(228,255,0,0.03)]">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-white/10 px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
        <span>THREAD <span className="text-zinc-400">#{t.id}</span></span>
        <span className="flex items-center gap-3">
          <span>/s/{t.channel}</span>
          <span style={{ color: t.restricted ? YELLOW : undefined }}>{t.restricted ? "CLASS: RESTRICTED" : "CLASS: OPEN"}</span>
        </span>
      </header>
      <div className="px-6 py-5">
        <h2 className="text-[18px] font-semibold tracking-tight leading-snug text-zinc-100 group-hover:text-[#E4FF00] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>{t.title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-400" style={{ fontFamily: "var(--font-sans)" }}>{t.excerpt}</p>
      </div>
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
        <span className="flex items-center gap-2">TTL:<span className={urgent ? "font-bold text-[#E4FF00]" : "text-zinc-300"}>{fmtTtl(t.ttlMinutes)}</span></span>
        <span>CONTRIBUTORS: <span className="text-zinc-300">{t.contributors}</span></span>
        <span>REPLIES: <span className="text-zinc-300">{t.replies}</span></span>
        <span className="ml-auto">{fmtAge(t.ageMinutes)}</span>
      </footer>
    </motion.article>
  );
}

function RightSidebar() {
  const [uptime, setUptime] = useState(0);
  const [sessionId, setSessionId] = useState("--------");
  useEffect(() => {
    setSessionId(Array.from({ length: 8 }, () => "0123456789ABCDEF"[rand(0, 15)]).join(""));
    const clock = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(clock);
  }, []);
  return (
    <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }} className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-black xl:flex">
      <section className="border-b border-white/10 px-6 py-6">
        <h3 className="text-[10px] tracking-[0.25em] text-zinc-600 font-mono">SESSION</h3>
        <div className="mt-4 flex items-center gap-3 text-[12px] font-sans font-semibold tracking-tight text-[#E4FF00]">
          <motion.span className="h-2 w-2 rounded-full bg-[#E4FF00] shadow-[0_0_10px_rgba(228,255,0,0.8)]" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          SECURE / ANONYMOUS
        </div>
        <div className="mt-4 flex flex-col gap-2 text-[11px] font-mono text-zinc-500">
          <div className="flex justify-between"><span>ID</span><span className="text-zinc-300">0x{sessionId}</span></div>
          <div className="flex justify-between"><span>UPTIME</span><span className="text-zinc-300">{fmtClock(uptime)}</span></div>
        </div>
      </section>
    </motion.aside>
  );
}


/* ------------------------------------------------------------------ */
/* Page - DYNAMIC CHANNEL PAGE                                        */
/* ------------------------------------------------------------------ */

function ChannelContent() {
  const params = useParams();
  const activeChannel = params.channel as string;

  const [sort, setSort] = useState<SortKey>("new");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [threadList, setThreadList] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannelThreads = async () => {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch from Supabase:", error);
      } else if (data) {
        const mappedThreads: Thread[] = data.map((row) => ({
          id: row.id,
          channel: row.channel,
          title: row.title,
          excerpt: row.excerpt,
          ttlMinutes: row.ttl_minutes,
          contributors: row.contributors,
          replies: row.replies,
          heat: row.heat,
          ageMinutes: row.age_minutes,
        }));
        setThreadList(mappedThreads);
      }
      setIsLoading(false);
    };

    fetchChannelThreads();
  }, [activeChannel]);

  const handleCreateThread = (newThread: { title: string; channel: string; excerpt: string }) => {
    const randomHex = () => Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    const generatedId = `${randomHex()}-${randomHex()}`;
    const created: Thread = {
      id: generatedId,
      channel: newThread.channel,
      title: newThread.title,
      excerpt: newThread.excerpt,
      ttlMinutes: 24 * 60,
      contributors: 1,
      replies: 0,
      heat: 5,
      ageMinutes: 0,
    };
    
    if (newThread.channel === activeChannel) {
        setThreadList((prev) => [created, ...prev]);
    }
  };

  const sortedThreads = useMemo(() => {
    const list = [...threadList];
    if (sort === "hot") list.sort((a, b) => b.heat - a.heat || b.replies - a.replies);
    if (sort === "new") list.sort((a, b) => a.ageMinutes - b.ageMinutes);
    if (sort === "expiring") list.sort((a, b) => a.ttlMinutes - b.ttlMinutes);
    return list;
  }, [threadList, sort]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${mono.variable} ${sans.variable} flex h-screen overflow-hidden text-zinc-300 bg-black selection:bg-[#E4FF00] selection:text-black`}>
        <LeftSidebar />

        <main className="relative min-w-0 flex-1 overflow-y-auto [scrollbar-width:none]">
          <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-8">
            
            <div className="sticky top-0 z-20 -mx-6 mb-8 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-[#E4FF00] font-sans">
                  /s/{activeChannel}
                </h1>
                <p className="mt-1 text-[10px] font-mono tracking-widest uppercase text-zinc-500">
                  {isLoading ? "ESTABLISHING CONNECTION..." : `${sortedThreads.length} ACTIVE THREADS IN ZONE`}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div role="tablist" aria-label="Sort threads" className="flex gap-2 font-mono">
                  {SORTS.map((s) => {
                    const active = sort === s.key;
                    return (
                      <button key={s.key} role="tab" aria-selected={active} onClick={() => setSort(s.key)} className={`relative px-4 py-1.5 text-[10px] tracking-[0.2em] outline-none transition-colors ${active ? "text-black" : "text-zinc-500 hover:text-white"}`}>
                        {active && <motion.span layoutId="sort-pill" aria-hidden className="absolute inset-0 bg-[#E4FF00] shadow-[0_0_15px_rgba(228,255,0,0.3)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                        <span className="relative font-bold z-10">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                <button onClick={() => setIsModalOpen(true)} className="bg-white/10 border border-white/20 text-white px-5 py-2 text-[10px] font-mono font-bold tracking-widest hover:bg-[#E4FF00] hover:text-black hover:border-[#E4FF00] hover:shadow-[0_0_20px_rgba(228,255,0,0.4)] transition-all duration-300">
                  + NEW THREAD
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-8 w-8 rounded-full border-b-2 border-r-2 border-[#E4FF00]" />
                <p className="mt-4 font-mono text-[10px] tracking-widest text-[#E4FF00]">DECRYPTING LOCAL DATABANKS...</p>
              </div>
            ) : sortedThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40 text-center">
                    <p className="font-mono text-[12px] tracking-[0.3em] text-zinc-500 uppercase">NO ACTIVE THREADS IN /s/{activeChannel}</p>
                    <p className="mt-2 font-mono text-[10px] tracking-widest text-zinc-600">Be the first to initiate encryption protocol.</p>
                </div>
            ) : (
              <motion.div variants={feedVariants} initial="hidden" animate="show" className="flex flex-col gap-5">
                {sortedThreads.map((t) => (
                  <ThreadCard key={t.id} t={t} />
                ))}
              </motion.div>
            )}

          </div>
        </main>

        <RightSidebar />
        <CreateThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateThread} />
      </div>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */
/* Outer Wrapper with Suspense Boundary                               */
/* ------------------------------------------------------------------ */

export default function ChannelPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-black font-mono text-xs text-[#E4FF00]">
        ESTABLISHING SECURE CHANNEL LINK...
      </div>
    }>
      <ChannelContent />
    </React.Suspense>
  );
}