"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, DollarSign, Frown, ArrowRight, Film, Menu, X, Play } from "lucide-react";
import Link from "next/link";

/* ─── testimonial data ─── */
const quotes = [
  {
    text: "I posted our Product Hunt video at midnight. Made with Morphix in 20 minutes.",
    author: "@indiefounder",
    detail: "847 upvotes on launch day",
  },
  {
    text: "Finally a launch video that doesn't look like I made it in Canva.",
    author: "@saasbuilder",
    detail: "Indie Hacker",
  },
  {
    text: "Worth every penny. Our demo converted 3x better than screenshots.",
    author: "@startupneo",
    detail: "Founder",
  },
  {
    text: "I've launched 6 products. This is the first time the video didn't embarrass me.",
    author: "@serialfounder",
    detail: "Serial Entrepreneur",
  },
  {
    text: "Sent it to investors. They asked who made the video. I said AI. They didn't believe me.",
    author: "@techfounder",
    detail: "Pre-seed Founder",
  },
  {
    text: "20 dollars. Are you kidding me. This would have cost me $800.",
    author: "@bootstrapped_dev",
    detail: "Bootstrapped",
  },
];

/* ─── scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
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

/* ─── reveal wrapper component ─── */
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

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Trigger hero animation on mount
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-[var(--font-geist-sans)] antialiased overflow-x-hidden selection:bg-blue-500/30">
      {/* ════════════════════════════════════
          NAV
          ════════════════════════════════════ */}
      <header className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-xl bg-[#0a0a0a]/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Film className="size-5 text-white group-hover:text-blue-400 transition-colors" />
            <span className="font-bold text-[17px] tracking-tight text-white">
              Morphix
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2 rounded-full transition-colors"
            >
              Get Early Access
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
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
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#222222] px-6 py-6 flex flex-col gap-4 animate-slide-down">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-full text-center transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Early Access
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* ════════════════════════════════════
            HERO
            ════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center justify-center px-6 hero-dot-grid">
          {/* Radial center glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[900px] h-[600px] bg-[rgba(59,130,246,0.06)] rounded-full blur-[140px]" />
          </div>

          <div
            className={`relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center hero-stagger ${
              heroVisible ? "hero-stagger-visible" : ""
            }`}
          >
            {/* Eyebrow */}
            <div className="hero-child inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#222222] bg-[#111111]/60 backdrop-blur-sm mb-8">
              <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6]">
                AI Video Marketing
              </span>
            </div>

            {/* H1 */}
            <h1 className="hero-child text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
              Your product deserves
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#a855f7] bg-clip-text text-transparent">
                a cinematic debut.
              </span>
            </h1>

            {/* Subtext */}
            <p className="hero-child text-lg md:text-xl text-[#888888] max-w-lg mx-auto mb-10 leading-relaxed">
              Upload your screenshots. Describe your vision. Get a professional
              marketing video in minutes.
            </p>

            {/* CTAs */}
            <div className="hero-child flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-[#3b82f6] to-[#7c3aed] hover:from-[#2563eb] hover:to-[#6d28d9] text-white font-semibold text-base px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Early Access — $20
              </Link>
              <a
                href="#problem"
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors group"
              >
                See how it works
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Social proof line */}
            <p className="hero-child mt-10 text-sm text-[#666666]">
              Join 500+ founders who launched with Morphix
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════
            PROBLEM
            ════════════════════════════════════ */}
        <section id="problem" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-[#3b82f6] block mb-4">
                Sound familiar?
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">
                Launching is hard enough.
              </h2>
            </Reveal>

            {/* Problem cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 — No time */}
              <Reveal delay={0}>
                <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 h-full">
                  <div className="size-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-5">
                    <Clock className="size-6 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">No time to edit</h3>
                  <p className="text-[#888888] leading-relaxed">
                    You spent months building. You have hours to launch. Video
                    editing isn&apos;t on the list.
                  </p>
                </div>
              </Reveal>

              {/* Card 2 — Featured */}
              <Reveal delay={120}>
                <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 border-t-2 border-t-[#3b82f6] shadow-[0_0_40px_rgba(59,130,246,0.06)] md:translate-y-[-4px] h-full">
                  <div className="size-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-5">
                    <DollarSign className="size-6 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Agencies cost thousands
                  </h3>
                  <p className="text-[#888888] leading-relaxed">
                    A proper launch video from a studio? $2,000 minimum. $200 if
                    you&apos;re lucky.
                  </p>
                </div>
              </Reveal>

              {/* Card 3 — DIY */}
              <Reveal delay={240}>
                <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 h-full">
                  <div className="size-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-5">
                    <Frown className="size-6 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    DIY looks like DIY
                  </h3>
                  <p className="text-[#888888] leading-relaxed">
                    Canva templates. Screen recordings. Everyone can tell. And it
                    undersells your product.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            HOW IT WORKS
            ════════════════════════════════════ */}
        <section id="how-it-works" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
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

            {/* ── Step 1 ── text left, visual right */}
            <Reveal>
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-28">
                <div className="relative">
                  <span className="text-[120px] md:text-[160px] font-black text-white/[0.024] leading-none block -mb-16 md:-mb-20 select-none">
                    01
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                    Feed it your product
                  </h3>
                  <p className="text-[#888888] text-lg leading-relaxed relative z-10">
                    Drop in your screenshots or paste your URL. Add a quick
                    description. That&apos;s all the context we need.
                  </p>
                </div>
                {/* Mock form UI */}
                <div className="bg-[#161616] border border-[#222222] rounded-2xl p-6">
                  <div className="space-y-4">
                    {/* App name field */}
                    <div>
                      <label className="text-xs text-[#666666] uppercase tracking-wider block mb-2">App name</label>
                      <div className="h-10 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-center px-4">
                        <span className="text-sm text-[#444444]">e.g. Morphix</span>
                      </div>
                    </div>
                    {/* Description field */}
                    <div>
                      <label className="text-xs text-[#666666] uppercase tracking-wider block mb-2">Description</label>
                      <div className="h-20 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-start p-3">
                        <span className="text-sm text-[#444444]">Describe what your product does...</span>
                      </div>
                    </div>
                    {/* Audience pills */}
                    <div>
                      <label className="text-xs text-[#666666] uppercase tracking-wider block mb-2">Target audience</label>
                      <div className="flex flex-wrap gap-2">
                        {["Founders", "Developers", "Designers", "Marketers"].map((pill) => (
                          <span
                            key={pill}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                              pill === "Founders"
                                ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"
                                : "bg-[#1a1a1a] border-[#2a2a2a] text-[#666666] hover:border-[#333333]"
                            }`}
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ── Step 2 ── visual left, text right */}
            <Reveal>
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-28">
                {/* Pipeline diagram */}
                <div className="order-2 md:order-1 bg-[#161616] border border-[#222222] rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-2">
                    {/* Claude */}
                    <div className="flex-1 text-center">
                      <div className="size-14 mx-auto rounded-full bg-[#1a1a1a] border-2 border-[#3b82f6]/40 flex items-center justify-center mb-2">
                        <span className="text-lg font-bold text-[#3b82f6]">C</span>
                      </div>
                      <p className="text-xs text-[#888888] font-medium">Claude AI</p>
                      <p className="text-[10px] text-[#444444]">Script & Direction</p>
                    </div>
                    {/* Animated connector 1 */}
                    <div className="h-px flex-shrink-0 w-12 pipeline-connector" />
                    {/* ElevenLabs */}
                    <div className="flex-1 text-center">
                      <div className="size-14 mx-auto rounded-full bg-[#1a1a1a] border-2 border-[#a855f7]/40 flex items-center justify-center mb-2">
                        <span className="text-lg font-bold text-[#a855f7]">E</span>
                      </div>
                      <p className="text-xs text-[#888888] font-medium">ElevenLabs</p>
                      <p className="text-[10px] text-[#444444]">Voiceover</p>
                    </div>
                    {/* Animated connector 2 */}
                    <div className="h-px flex-shrink-0 w-12 pipeline-connector pipeline-connector-delayed" />
                    {/* Remotion */}
                    <div className="flex-1 text-center">
                      <div className="size-14 mx-auto rounded-full bg-[#1a1a1a] border-2 border-[#3b82f6]/40 flex items-center justify-center mb-2">
                        <span className="text-lg font-bold text-[#3b82f6]">R</span>
                      </div>
                      <p className="text-xs text-[#888888] font-medium">Remotion</p>
                      <p className="text-[10px] text-[#444444]">Render</p>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2 relative">
                  <span className="text-[120px] md:text-[160px] font-black text-white/[0.024] leading-none block -mb-16 md:-mb-20 select-none">
                    02
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                    AI does the heavy lifting
                  </h3>
                  <p className="text-[#888888] text-lg leading-relaxed relative z-10">
                    Claude analyzes your product, writes the script, directs the
                    shots. ElevenLabs records the voiceover. All automatically.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* ── Step 3 ── text left, visual right */}
            <Reveal>
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                <div className="relative">
                  <span className="text-[120px] md:text-[160px] font-black text-white/[0.024] leading-none block -mb-16 md:-mb-20 select-none">
                    03
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 relative z-10">
                    Download. Post. Launch.
                  </h3>
                  <p className="text-[#888888] text-lg leading-relaxed relative z-10">
                    Your cinematic marketing video ready in minutes. 1080p MP4.
                    Optimized for every platform.
                  </p>
                </div>
                {/* Mock video player */}
                <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
                  {/* Player viewport */}
                  <div className="aspect-video flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,rgba(168,85,247,0.03)_40%,transparent_70%)]" />
                    <div className="size-16 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center hover:bg-[#3b82f6]/25 transition-all shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer">
                      <Play className="size-6 text-[#3b82f6] ml-0.5" />
                    </div>
                  </div>
                  {/* Scrubber bar */}
                  <div className="px-4 py-2 border-t border-[#222222]">
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full w-[35%] bg-gradient-to-r from-[#3b82f6] to-[#a855f7] rounded-full" />
                    </div>
                  </div>
                  {/* File label */}
                  <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-300">morphix_launch_video.mp4</p>
                      <p className="text-xs text-[#444444]">1080p • 0:45</p>
                    </div>
                    <span className="text-xs text-[#3b82f6] font-medium">Ready</span>
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
          <div className="max-w-6xl mx-auto px-6 mb-16">
            <Reveal>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center">
                Built for builders.
              </h2>
            </Reveal>
          </div>

          {/* Row 1 — scrolls left */}
          <div className="marquee-container mb-4">
            <div className="marquee-track">
              {[...quotes, ...quotes].map((q, i) => (
                <div
                  key={`r1-${i}`}
                  className="bg-[#111111] border border-[#222222] rounded-2xl p-6 w-[320px] flex-shrink-0"
                >
                  <p className="text-sm text-white leading-relaxed mb-4 italic">
                    &ldquo;{q.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#3b82f6]">
                      {q.author}
                    </span>
                    <span className="text-xs text-[#666666]">{q.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div className="marquee-container">
            <div className="marquee-track-reverse">
              {[...quotes.slice(3), ...quotes.slice(0, 3), ...quotes].map(
                (q, i) => (
                  <div
                    key={`r2-${i}`}
                    className="bg-[#111111] border border-[#222222] rounded-2xl p-6 w-[320px] flex-shrink-0"
                  >
                    <p className="text-sm text-white leading-relaxed mb-4 italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#3b82f6]">
                        {q.author}
                      </span>
                      <span className="text-xs text-[#666666]">{q.detail}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
