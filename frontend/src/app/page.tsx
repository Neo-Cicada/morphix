"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  MotionConfig,
} from "framer-motion";
import {
  Clock,
  DollarSign,
  Frown,
  ArrowRight,
  Film,
  Menu,
  X,
  Play,
  Upload,
  Sparkles,
  Download,
  Check,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

/* ─── testimonial data ─── */
const quotes = [
  {
    text: "I posted our Product Hunt video at midnight. Made with Morphix in 20 minutes.",
    author: "@indiefounder",
    detail: "847 upvotes on launch day",
    initials: "IF",
    color: "#3b82f6",
  },
  {
    text: "Finally a launch video that doesn't look like I made it in Canva.",
    author: "@saasbuilder",
    detail: "Indie Hacker",
    initials: "SB",
    color: "#a855f7",
  },
  {
    text: "Worth every penny. Our demo converted 3x better than screenshots.",
    author: "@startupneo",
    detail: "Founder",
    initials: "SN",
    color: "#3b82f6",
  },
  {
    text: "I've launched 6 products. This is the first time the video didn't embarrass me.",
    author: "@serialfounder",
    detail: "Serial Entrepreneur",
    initials: "SF",
    color: "#a855f7",
  },
  {
    text: "Sent it to investors. They asked who made the video. I said AI. They didn't believe me.",
    author: "@techfounder",
    detail: "Pre-seed Founder",
    initials: "TF",
    color: "#22c55e",
  },
  {
    text: "$20. Are you kidding me. This would have cost me $800 from a freelancer.",
    author: "@bootstrapped_dev",
    detail: "Bootstrapped",
    initials: "BD",
    color: "#f59e0b",
  },
];

/* ─── pricing tiers ─── */
const pricingTiers = [
  {
    name: "Starter",
    price: "$20",
    unit: "per video",
    description: "One video. One launch. No subscriptions.",
    features: [
      "1 cinematic marketing video",
      "1080p MP4 download",
      "AI script + voiceover",
      "Platform-optimized cuts",
      "Credits never expire",
    ],
    cta: "Get my video",
    featured: false,
    badge: null,
  },
  {
    name: "Builder",
    price: "$75",
    unit: "5 videos",
    description: "For founders who ship fast and often.",
    features: [
      "5 cinematic marketing videos",
      "1080p MP4 + vertical cuts",
      "Priority rendering queue",
      "Style variations per video",
      "Credits never expire",
    ],
    cta: "Get 5 videos",
    featured: true,
    badge: "Best value",
  },
  {
    name: "Studio",
    price: "$180",
    unit: "15 videos",
    description: "Your agency-grade content engine.",
    features: [
      "15 cinematic marketing videos",
      "All formats + aspect ratios",
      "White-label download option",
      "Dedicated rendering priority",
      "Credits never expire",
    ],
    cta: "Go full studio",
    featured: false,
    badge: null,
  },
];

/* ─── FAQ data ─── */
const faqItems = [
  {
    q: "What do I need to get started?",
    a: "Just your product screenshots or URL, and a one-sentence description of what your product does. That's it. We take care of the script, direction, voiceover, and render.",
  },
  {
    q: "How long does it take?",
    a: "Most videos are ready within 5–10 minutes of submitting. Peak hours might add a few minutes. You'll get notified the second it's done.",
  },
  {
    q: "What if I don't like the result?",
    a: "You can regenerate with new direction notes at a discounted credit cost. We're also constantly improving the model based on real launch feedback.",
  },
  {
    q: "Do credits expire?",
    a: "Never. Buy once, use whenever. Launch in a week or launch in six months — your credits wait for you.",
  },
  {
    q: "Can I use it for multiple products?",
    a: "Absolutely. Credits work across any product you create. Many founders use Morphix for every new launch they ship.",
  },
];

/* ─── scroll-reveal hook (IntersectionObserver) ─── */
function useReveal(threshold = 0.15): {
  ref: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Reveal wrapper ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-item ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Reveal delay={index * 60}>
      <div className="border-b border-[#1e1e1e] last:border-b-0">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
          aria-expanded={open}
        >
          <span className="text-base md:text-lg font-medium text-white group-hover:text-[#3b82f6] transition-colors duration-200">
            {q}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="ml-4 flex-shrink-0 text-zinc-500"
          >
            <ChevronDown className="size-5" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="text-[#888888] leading-relaxed pb-6 text-sm md:text-base">
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setNavScrolled(v > 40);
  });

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#080808] text-white antialiased overflow-x-hidden selection:bg-blue-500/30">

        {/* ════════════════════════════════════
            NAV
            ════════════════════════════════════ */}
        <motion.header
          className="fixed top-0 w-full z-50 transition-all duration-300"
          style={{
            backdropFilter: navScrolled ? "blur(20px)" : "blur(0px)",
            backgroundColor: navScrolled
              ? "rgba(8, 8, 8, 0.85)"
              : "transparent",
            borderBottom: navScrolled
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid transparent",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Wordmark */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Film className="size-5 text-white group-hover:text-[#3b82f6] transition-colors" />
              <span className="font-bold text-[17px] tracking-tight text-white">
                Morphix
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-white text-[#080808] hover:bg-zinc-100 px-5 py-2 rounded-full transition-all cursor-pointer"
              >
                Get Early Access
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-zinc-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="md:hidden bg-[#080808]/95 backdrop-blur-xl border-t border-[#1e1e1e] px-6 py-6 flex flex-col gap-4"
              >
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold bg-white text-[#080808] px-5 py-2.5 rounded-full text-center transition-all cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Early Access
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <main>
          {/* ════════════════════════════════════
              HERO
              ════════════════════════════════════ */}
          <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
            {/* Aurora background */}
            <div className="aurora-bg absolute inset-0" />

            {/* Dot grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Scan line */}
            <div className="scan-line" />

            {/* Orbiting ring visual */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Outer ring */}
              <div className="relative size-[440px] md:size-[560px]">
                <div className="absolute inset-0 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.03]" style={{ inset: "40px" }} />

                {/* Orbiting dot 1 */}
                <div
                  className="orbit-dot absolute size-3 rounded-full bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  style={{ top: "50%", left: "50%", marginTop: "-6px", marginLeft: "-6px" }}
                />
                {/* Orbiting dot 2 */}
                <div
                  className="orbit-dot-reverse absolute size-2 rounded-full bg-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                  style={{ top: "50%", left: "50%", marginTop: "-4px", marginLeft: "-4px" }}
                />
              </div>
            </div>

            {/* Hero content */}
            <div
              className={`relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center hero-stagger ${
                heroVisible ? "hero-stagger-visible" : ""
              }`}
            >
              {/* Eyebrow pill */}
              <div className="hero-child hide inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm mb-8">
                <span className="size-1.5 rounded-full bg-[#3b82f6] block" />
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-300">
                  AI Video Marketing · $20 per video
                </span>
              </div>

              {/* H1 */}
              <h1 className="hero-child text-5xl sm:text-6xl md:text-[80px] lg:text-[96px] font-extrabold tracking-tight leading-[1.02] mb-6">
                Your product deserves
                <br />
                <span className="bg-gradient-to-r from-[#3b82f6] via-[#818cf8] to-[#a855f7] bg-clip-text text-transparent">
                  a cinematic debut.
                </span>
              </h1>

              {/* Subtext */}
              <p className="hero-child text-lg md:text-xl text-[#888888] max-w-[520px] mx-auto mb-10 leading-relaxed">
                Upload your screenshots. Describe your vision. Walk away with a
                marketing video that makes investors stop scrolling.
              </p>

              {/* CTAs */}
              <div className="hero-child flex flex-col sm:flex-row gap-4 items-center">
                <Link
                  href="/signup"
                  className="cta-btn-primary text-white font-semibold text-base px-8 py-4 rounded-xl cursor-pointer"
                >
                  Get Early Access — $20
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors group cursor-pointer"
                >
                  See how it works
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              {/* Social proof micro-line */}
              <p className="hero-child mt-10 text-sm text-[#555555]">
                Join 500+ founders who launched with Morphix
              </p>

              {/* Floating video card mockups */}
              <div className="hero-child mt-16 relative w-full max-w-2xl mx-auto hidden sm:block">
                {/* Left card */}
                <div
                  className="float-card absolute -left-12 -top-4 bg-[#111111] border border-[#1e1e1e] rounded-2xl p-4 w-52 text-left shadow-2xl"
                >
                  <div className="aspect-video rounded-lg bg-[#0a0a0a] flex items-center justify-center mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 to-[#a855f7]/10" />
                    <Play className="size-5 text-[#3b82f6] ml-0.5 relative z-10" />
                  </div>
                  <p className="text-xs font-medium text-zinc-300">morphix_launch.mp4</p>
                  <p className="text-[10px] text-[#555555] mt-0.5">1080p · Ready in 7 min</p>
                </div>

                {/* Center card — main */}
                <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                  <div className="aspect-video relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 via-transparent to-[#a855f7]/10" />
                    <div className="size-14 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center hover:bg-[#3b82f6]/25 transition-all shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer">
                      <Play className="size-6 text-[#3b82f6] ml-0.5" />
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-[#1e1e1e] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-300">demo_video.mp4</p>
                      <p className="text-xs text-[#555555] mt-0.5">1080p · 0:45</p>
                    </div>
                    <span className="text-xs font-semibold text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded-full">
                      Ready
                    </span>
                  </div>
                </div>

                {/* Right card */}
                <div
                  className="float-card-delayed absolute -right-12 top-8 bg-[#111111] border border-[#1e1e1e] rounded-2xl p-4 w-44 text-left shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-full bg-[#a855f7]/20 flex items-center justify-center">
                      <Sparkles className="size-3.5 text-[#a855f7]" />
                    </div>
                    <p className="text-xs font-medium text-zinc-300">AI ready</p>
                  </div>
                  <p className="text-[10px] text-[#555555] leading-relaxed">
                    Script written. Voiceover recorded. Rendering now.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              PROBLEM
              ════════════════════════════════════ */}
          <section id="problem" className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-5">
                  Sound familiar?
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Launching is hard enough.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="text-[#666666] text-lg mb-20 max-w-lg">
                  You&apos;ve spent months building. You shouldn&apos;t have to
                  spend weeks making a video.
                </p>
              </Reveal>

              {/* Pain points — numbered editorial layout */}
              <div className="space-y-0">
                {[
                  {
                    Icon: Clock,
                    num: "01",
                    title: "No time to edit",
                    body: "You spent months building. You have hours to launch. Video editing isn't on the list — and it never was.",
                    delay: 0,
                  },
                  {
                    Icon: DollarSign,
                    num: "02",
                    title: "Agencies cost thousands",
                    body: "A proper launch video from a studio? $2,000 minimum. $200 if you're lucky. Neither is in a bootstrapper's budget.",
                    delay: 100,
                  },
                  {
                    Icon: Frown,
                    num: "03",
                    title: "DIY looks like DIY",
                    body: "Canva templates. Screen recordings. Everyone can tell. And it undersells the product you spent six months building.",
                    delay: 200,
                  },
                ].map(({ Icon, num, title, body, delay }) => (
                  <Reveal key={num} delay={delay}>
                    <div className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-12 py-12 border-b border-[#1a1a1a] group cursor-default hover:border-[#2a2a2a] transition-colors">
                      <div className="flex items-start gap-4 md:flex-col md:gap-0">
                        <span className="ghost-number">{num}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-12 pt-2">
                        <div className="size-12 rounded-xl bg-[#111111] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0 group-hover:border-[#2a2a2a] transition-colors">
                          <Icon className="size-5 text-zinc-500" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-semibold mb-3 tracking-tight">
                            {title}
                          </h3>
                          <p className="text-[#666666] text-base leading-relaxed max-w-lg">
                            {body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              HOW IT WORKS
              ════════════════════════════════════ */}
          <section id="how-it-works" className="py-32 px-6 bg-[#040404]">
            <div className="max-w-6xl mx-auto">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-4">
                  The process
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-20">
                  Three steps to cinema.
                </h2>
              </Reveal>

              {/* ── Step 1 ── */}
              <Reveal>
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-28">
                  <div className="relative">
                    <span className="ghost-number block -mb-8 select-none">01</span>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="size-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
                        <Upload className="size-4 text-[#3b82f6]" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
                        Upload
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                      Feed it your product
                    </h3>
                    <p className="text-[#666666] text-lg leading-relaxed relative z-10">
                      Drop in your screenshots or paste your URL. Add a quick
                      description. That&apos;s all the context we need.
                    </p>
                  </div>
                  {/* Mock form UI */}
                  <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#555555] uppercase tracking-wider block mb-2">
                          App name
                        </label>
                        <div className="h-10 bg-[#111111] rounded-lg border border-[#222222] flex items-center px-4">
                          <span className="text-sm text-[#444444]">e.g. Morphix</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#555555] uppercase tracking-wider block mb-2">
                          Description
                        </label>
                        <div className="h-20 bg-[#111111] rounded-lg border border-[#222222] flex items-start p-3">
                          <span className="text-sm text-[#444444]">
                            Describe what your product does...
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#555555] uppercase tracking-wider block mb-2">
                          Target audience
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {["Founders", "Developers", "Designers", "Marketers"].map(
                            (pill) => (
                              <span
                                key={pill}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                  pill === "Founders"
                                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"
                                    : "bg-[#111111] border-[#222222] text-[#555555] hover:border-[#333333]"
                                }`}
                              >
                                {pill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* ── Step 2 ── */}
              <Reveal>
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-28">
                  {/* Pipeline diagram */}
                  <div className="order-2 md:order-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 text-center">
                        <div className="size-14 mx-auto rounded-full bg-[#111111] border-2 border-[#3b82f6]/40 flex items-center justify-center mb-2">
                          <span className="text-base font-bold text-[#3b82f6]">C</span>
                        </div>
                        <p className="text-xs text-[#888888] font-medium">Claude AI</p>
                        <p className="text-[10px] text-[#444444]">Script & Direction</p>
                      </div>
                      <div className="pipeline-connector flex-shrink-0 w-12" />
                      <div className="flex-1 text-center">
                        <div className="size-14 mx-auto rounded-full bg-[#111111] border-2 border-[#a855f7]/40 flex items-center justify-center mb-2">
                          <span className="text-base font-bold text-[#a855f7]">E</span>
                        </div>
                        <p className="text-xs text-[#888888] font-medium">ElevenLabs</p>
                        <p className="text-[10px] text-[#444444]">Voiceover</p>
                      </div>
                      <div className="pipeline-connector pipeline-connector-delayed flex-shrink-0 w-12" />
                      <div className="flex-1 text-center">
                        <div className="size-14 mx-auto rounded-full bg-[#111111] border-2 border-[#3b82f6]/40 flex items-center justify-center mb-2">
                          <span className="text-base font-bold text-[#3b82f6]">R</span>
                        </div>
                        <p className="text-xs text-[#888888] font-medium">Remotion</p>
                        <p className="text-[10px] text-[#444444]">Render</p>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 relative">
                    <span className="ghost-number block -mb-8 select-none">02</span>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="size-9 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center">
                        <Sparkles className="size-4 text-[#a855f7]" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#a855f7]">
                        Generate
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                      AI does the heavy lifting
                    </h3>
                    <p className="text-[#666666] text-lg leading-relaxed relative z-10">
                      Claude analyzes your product, writes the script, directs
                      the shots. ElevenLabs records the voiceover. All
                      automatically.
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* ── Step 3 ── */}
              <Reveal>
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                  <div className="relative">
                    <span className="ghost-number block -mb-8 select-none">03</span>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="size-9 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                        <Download className="size-4 text-[#22c55e]" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#22c55e]">
                        Download
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                      Download. Post. Launch.
                    </h3>
                    <p className="text-[#666666] text-lg leading-relaxed relative z-10">
                      Your cinematic marketing video ready in minutes. 1080p
                      MP4. Optimized for every platform.
                    </p>
                  </div>
                  {/* Mock video player */}
                  <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                    <div className="aspect-video flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,rgba(168,85,247,0.03)_40%,transparent_70%)]" />
                      <div className="size-16 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center hover:bg-[#3b82f6]/25 transition-all shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer">
                        <Play className="size-6 text-[#3b82f6] ml-0.5" />
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-[#1e1e1e]">
                      <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full w-[35%] bg-gradient-to-r from-[#3b82f6] to-[#a855f7] rounded-full" />
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          morphix_launch_video.mp4
                        </p>
                        <p className="text-xs text-[#444444]">1080p • 0:45</p>
                      </div>
                      <span className="text-xs text-[#3b82f6] font-semibold bg-[#3b82f6]/10 px-2.5 py-1 rounded-full">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ════════════════════════════════════
              SOCIAL PROOF — MARQUEE
              ════════════════════════════════════ */}
          <section className="py-32 px-0 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-4">
                  Founder reviews
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Built for builders.
                </h2>
              </Reveal>
            </div>

            {/* Row 1 — left */}
            <div className="marquee-container mb-4">
              <div className="marquee-track">
                {[...quotes, ...quotes].map((q, i) => (
                  <div
                    key={`r1-${i}`}
                    className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 w-[340px] flex-shrink-0 hover:border-[#2a2a2a] transition-colors cursor-default"
                  >
                    <p className="text-sm text-white leading-relaxed mb-5 italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: `${q.color}22`, color: q.color }}
                      >
                        {q.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#3b82f6]">{q.author}</p>
                        <p className="text-xs text-[#555555]">{q.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 — right */}
            <div className="marquee-container">
              <div className="marquee-track-reverse">
                {[...quotes.slice(3), ...quotes.slice(0, 3), ...quotes].map(
                  (q, i) => (
                    <div
                      key={`r2-${i}`}
                      className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 w-[340px] flex-shrink-0 hover:border-[#2a2a2a] transition-colors cursor-default"
                    >
                      <p className="text-sm text-white leading-relaxed mb-5 italic">
                        &ldquo;{q.text}&rdquo;
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className="size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: `${q.color}22`, color: q.color }}
                        >
                          {q.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#3b82f6]">{q.author}</p>
                          <p className="text-xs text-[#555555]">{q.detail}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              PRICING
              ════════════════════════════════════ */}
          <section id="pricing" className="py-32 px-6 bg-[#040404]">
            <div className="max-w-6xl mx-auto">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-4">
                  Pricing
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Pay for what you ship.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="text-[#666666] text-lg mb-16 max-w-lg">
                  No subscriptions. No monthly fees. Credits never expire. Buy
                  once, use whenever you&apos;re ready to launch.
                </p>
              </Reveal>

              <div className="grid md:grid-cols-3 gap-5 items-start">
                {pricingTiers.map((tier, i) => (
                  <Reveal key={tier.name} delay={i * 100}>
                    {tier.featured ? (
                      <div className="pricing-card-featured rounded-2xl p-px relative">
                        <div className="bg-[#111111] rounded-[calc(1rem-1px)] p-8 h-full flex flex-col">
                          {tier.badge && (
                            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#3b82f6]/20 to-[#a855f7]/20 border border-[#3b82f6]/30 mb-5">
                              <Sparkles className="size-3 text-[#3b82f6]" />
                              <span className="text-xs font-semibold text-[#3b82f6]">
                                {tier.badge}
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {tier.name}
                          </h3>
                          <div className="flex items-end gap-1.5 mb-2">
                            <span className="text-5xl font-extrabold tracking-tight text-white">
                              {tier.price}
                            </span>
                            <span className="text-sm text-[#555555] mb-2">{tier.unit}</span>
                          </div>
                          <p className="text-sm text-[#666666] mb-8 leading-relaxed">
                            {tier.description}
                          </p>
                          <ul className="space-y-3 mb-10 flex-1">
                            {tier.features.map((f) => (
                              <li key={f} className="flex items-start gap-3">
                                <Check className="size-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-zinc-300">{f}</span>
                              </li>
                            ))}
                          </ul>
                          <Link
                            href="/signup"
                            className="cta-btn-primary text-white text-sm font-semibold py-3.5 rounded-xl text-center cursor-pointer block"
                          >
                            {tier.cta}
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-8 flex flex-col hover:border-[#2a2a2a] transition-colors">
                        {tier.badge && (
                          <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 mb-5">
                            <span className="text-xs font-semibold text-zinc-300">
                              {tier.badge}
                            </span>
                          </div>
                        )}
                        {!tier.badge && <div className="mb-5 h-6" />}
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {tier.name}
                        </h3>
                        <div className="flex items-end gap-1.5 mb-2">
                          <span className="text-5xl font-extrabold tracking-tight text-white">
                            {tier.price}
                          </span>
                          <span className="text-sm text-[#555555] mb-2">{tier.unit}</span>
                        </div>
                        <p className="text-sm text-[#666666] mb-8 leading-relaxed">
                          {tier.description}
                        </p>
                        <ul className="space-y-3 mb-10 flex-1">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-start gap-3">
                              <Check className="size-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-zinc-400">{f}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/signup"
                          className="block w-full bg-[#161616] hover:bg-[#1e1e1e] border border-[#222222] hover:border-[#333333] text-white text-sm font-semibold py-3.5 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          {tier.cta}
                        </Link>
                      </div>
                    )}
                  </Reveal>
                ))}
              </div>

              {/* Credits-never-expire callout */}
              <Reveal delay={100}>
                <div className="mt-10 text-center">
                  <p className="text-sm text-[#444444]">
                    All plans include unlimited revisions per video ·{" "}
                    <span className="text-[#555555]">Credits never expire</span>{" "}
                    · Cancel at any time (there&apos;s nothing to cancel)
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ════════════════════════════════════
              FAQ
              ════════════════════════════════════ */}
          <section id="faq" className="py-32 px-6">
            <div className="max-w-3xl mx-auto">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-4">
                  FAQ
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">
                  Questions, answered.
                </h2>
              </Reveal>

              <div className="divide-y divide-[#1a1a1a]">
                {faqItems.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} index={i} />
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              FINAL CTA
              ════════════════════════════════════ */}
          <section className="py-32 px-6 noise-overlay bg-[#040404] relative">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              {/* Glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-[600px] h-[300px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.04) 50%, transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />
              </div>

              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-6">
                  Ready?
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.02]">
                  Your product is ready
                  <br />
                  <span className="bg-gradient-to-r from-[#3b82f6] to-[#a855f7] bg-clip-text text-transparent">
                    for its close-up.
                  </span>
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-lg text-[#666666] mb-12 max-w-lg mx-auto leading-relaxed">
                  Every week you wait is another week you launch without a video
                  that does your product justice.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="cta-btn-primary text-white font-semibold text-lg px-10 py-5 rounded-2xl cursor-pointer inline-flex items-center gap-2.5"
                  >
                    Get Early Access — $20
                    <ArrowUpRight className="size-5" />
                  </Link>
                </div>
                <p className="mt-6 text-sm text-[#444444]">
                  One video. 10 minutes. No subscription needed.
                </p>
              </Reveal>
            </div>
          </section>
        </main>

        {/* ════════════════════════════════════
            FOOTER
            ════════════════════════════════════ */}
        <footer className="border-t border-[#111111] py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left — logo + tagline */}
            <div>
              <Link href="/" className="flex items-center gap-2.5 group mb-2">
                <Film className="size-4 text-white group-hover:text-[#3b82f6] transition-colors" />
                <span className="font-bold text-sm tracking-tight text-white">
                  Morphix
                </span>
              </Link>
              <p className="text-xs text-[#444444]">
                Transform your product into cinema.
              </p>
            </div>

            {/* Right — links */}
            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { label: "Product", href: "#how-it-works" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
                { label: "Log in", href: "/login" },
                { label: "Sign up", href: "/signup" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#555555] hover:text-white transition-colors cursor-pointer"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-[#0e0e0e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-[#333333]">
              © 2025 Morphix. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-xs text-[#333333] hover:text-[#555555] transition-colors cursor-pointer"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-xs text-[#333333] hover:text-[#555555] transition-colors cursor-pointer"
              >
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
