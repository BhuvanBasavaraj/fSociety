"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IBM_Plex_Mono } from "next/font/google";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const YELLOW = "#FEE500";
const BG = "#0A0B0E";

type BootLine = { text: string; tone: "accent" | "dim" };

const BOOT_LINES: BootLine[] = [
  { text: "DECRYPTING CONNECTION...", tone: "accent" },
  { text: "HANDSHAKE ............ OK", tone: "dim" },
  { text: "ROUTE: 3 RELAYS / LOGGING: OFF", tone: "dim" },
  { text: "IDENTITY: UNSET. SESSION PASSCODE REQUIRED.", tone: "accent" },
];

/** Blinking block cursor. */
function Cursor() {
  return (
    <motion.span
      aria-hidden
      className="ml-1 inline-block h-[1em] w-[0.6em] translate-y-[0.15em]"
      style={{ backgroundColor: YELLOW }}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        times: [0, 0.5, 0.5, 1],
        ease: "linear",
      }}
    />
  );
}

/** Types out `text` by animating a character counter. */
function TypedLine({
  text,
  speed = 0.032,
  onDone,
}: {
  text: string;
  speed?: number;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const visible = useTransform(count, (v) => text.slice(0, Math.round(v)));
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const controls = animate(count, text.length, {
      duration: reduce ? 0 : text.length * speed,
      ease: "linear",
      onComplete: () => doneRef.current(),
    });
    return () => controls.stop();
  }, [count, text, speed, reduce]);

  return <motion.span>{visible}</motion.span>;
}

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // index of the line currently typing
  const [credential, setCredential] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "verifying">("idle");

  const bootDone = step >= BOOT_LINES.length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === "verifying") return;
    if (credential.trim().length < 3) {
      setStatus("error");
      return;
    }
    setStatus("verifying");
    // TODO: replace with real auth / session creation
    setTimeout(() => router.push("/board"), 1200);
  };

  return (
    <main
      className={`${mono.className} relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 text-sm text-zinc-300 sm:text-base`}
      style={{
        backgroundColor: BG,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)",
      }}
    >
      {/* Vignette keeps focus on the terminal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Corner readouts */}
      <div
        aria-hidden
        className="absolute left-5 top-5 text-[11px] tracking-widest text-zinc-600"
      >
        fSOCIETY // NODE-07
      </div>
      <div
        aria-hidden
        className="absolute bottom-5 right-5 text-[11px] tracking-widest text-zinc-600"
      >
        TLS 1.3 / E2E
      </div>

      <section className="relative z-10 w-full max-w-xl">
        {/* Boot log */}
        <div className="space-y-2" aria-live="polite">
          {BOOT_LINES.map((line, i) => {
            if (i > step) return null;
            const color = line.tone === "accent" ? YELLOW : undefined;
            const isCurrent = i === step;
            return (
              <p
                key={line.text}
                className={line.tone === "dim" ? "text-zinc-500" : "font-medium"}
                style={{ color }}
              >
                <span className="mr-3 select-none text-zinc-600">&gt;</span>
                {isCurrent ? (
                  <TypedLine text={line.text} onDone={() => setStep((s) => s + 1)} />
                ) : (
                  line.text
                )}
                {isCurrent && !bootDone && <Cursor />}
              </p>
            );
          })}
        </div>

        {/* Passcode form fades in once the log finishes */}
        <AnimatePresence>
          {bootDone && (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              noValidate
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mt-12"
            >
              <label
                htmlFor="credential"
                className="block text-xs tracking-[0.25em] text-zinc-500"
              >
                SESSION PASSCODE / EMAIL
              </label>

              <div className="relative mt-3">
                <input
                  id="credential"
                  name="credential"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "verifying"}
                  placeholder="enter credential"
                  aria-invalid={status === "error"}
                  aria-describedby="credential-msg"
                  className="peer w-full border-0 border-b border-zinc-700 bg-transparent py-3 text-base tracking-wide text-zinc-100 caret-[#FEE500] outline-none transition-colors placeholder:text-zinc-700 focus:border-[#FEE500] disabled:opacity-50"
                />
                {/* Focus bar that draws across the underline */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-[#FEE500] shadow-[0_0_12px_rgba(254,229,0,0.8)] transition-transform duration-500 peer-focus:scale-x-100"
                />
              </div>

              <p
                id="credential-msg"
                role="status"
                className="mt-3 h-5 text-xs tracking-wider"
                style={{ color: status === "error" ? "#FF5C5C" : "#71717a" }}
              >
                {status === "error" && "ERR: CREDENTIAL REQUIRED (MIN 3 CHARACTERS)"}
                {status === "verifying" && "VERIFYING SESSION..."}
              </p>

              <motion.button
                type="submit"
                disabled={status === "verifying"}
                initial="rest"
                whileHover="hover"
                whileFocus="hover"
                whileTap={{ scale: 0.98 }}
                className="relative mt-6 w-full overflow-hidden border px-6 py-4 text-sm font-bold tracking-[0.3em] outline-none disabled:cursor-wait"
                style={{ borderColor: YELLOW }}
              >
                {/* Fill sweeps in from the left on hover */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left"
                  style={{ backgroundColor: YELLOW }}
                  variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                  transition={{ duration: 0.28, ease: [0.76, 0, 0.24, 1] }}
                />
                <motion.span
                  className="relative z-10 block"
                  variants={{
                    rest: { color: YELLOW },
                    hover: { color: BG },
                  }}
                  transition={{ duration: 0.28 }}
                >
                  {status === "verifying" ? "AUTHENTICATING..." : "ENTER THE BOARD"}
                </motion.span>
              </motion.button>

              <p className="mt-6 text-[11px] leading-relaxed tracking-wider text-zinc-600">
                NO ACCOUNT NAMES. NO TRACKING. SESSIONS EXPIRE WHEN YOU LEAVE.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
