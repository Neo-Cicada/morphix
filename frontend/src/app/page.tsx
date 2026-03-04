import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Upload, Clapperboard, Check, Layers, Sparkles } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-primary/30 antialiased overflow-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-xl supports-backdrop-blur:bg-[#0a0a0a]/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 hover:border-primary/50 transition-colors">
              <span className="font-semibold text-lg text-primary tracking-tighter">M</span>
            </div>
            <span className="font-medium text-[15px] tracking-tight text-zinc-100">Morphix</span>
          </div>
          <nav className="flex items-center gap-6">
            <Button asChild variant="ghost" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-transparent cursor-pointer">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="h-9 px-5 text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer">
              <Link href="/signup">Get Early Access</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* SUBTLE GLOW EFFECT (Vercel/Linear style) */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
        
        {/* HERO SECTION */}
        <section className="pt-40 md:pt-52 pb-24 px-6 relative flex flex-col items-center">
          <div className="container mx-auto flex flex-col items-center text-center max-w-5xl relative z-10">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md mb-8">
              <Sparkles className="size-3.5 text-secondary" />
              <span className="text-xs font-medium text-zinc-300">Morphix Engine v2.0 is live</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-500 leading-[1.05] max-w-4xl">
              Turn software into <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">cinema.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl font-medium tracking-tight">
              Upload your screen recording. Our AI engine infers layers, motion, and pacing to generate a professional-grade marketing video ready for the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
              <Button asChild size="lg" className="h-12 px-8 text-[15px] font-medium bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] cursor-pointer">
                <Link href="/signup">Start Creating Free</Link>
              </Button>
            </div>

            {/* HERO PRODUCT VISUAL */}
            <div className="mt-24 w-full max-w-5xl rounded-2xl border border-zinc-800/60 bg-[#111] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/90 pointer-events-none z-10" />
              <div className="aspect-[16/9] w-full flex items-center justify-center relative">
                {/* Simulated UI layout */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_100%)]" />
                <div className="flex flex-col items-center gap-6 z-20 transition-transform duration-700 group-hover:scale-105">
                  <div className="size-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                    <Clapperboard className="size-8 text-primary/80" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium tracking-widest uppercase text-zinc-500">Product Demo Runtime</p>
                    <p className="text-zinc-600 text-xs font-mono">00:01:24:12</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES TEASER */}
        <section className="py-32 px-6 relative z-10 border-t border-white/[0.02]">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-100 max-w-2xl">
                The precision of a studio. <br />
                <span className="text-zinc-500">The speed of software.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/40 border-zinc-800/50 overflow-hidden group">
                <CardHeader>
                  <div className="size-12 rounded-lg bg-zinc-800/50 flex items-center justify-center mb-4 text-zinc-300 group-hover:text-primary transition-colors">
                    <Layers className="size-6" />
                  </div>
                  <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">Intelligent Layering</CardTitle>
                  <CardDescription className="text-zinc-400 text-base">
                    We parse raw pixels to infer depth, separating foreground UI elements from background canvas automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800/50 overflow-hidden group">
                <CardHeader>
                  <div className="size-12 rounded-lg bg-zinc-800/50 flex items-center justify-center mb-4 text-zinc-300 group-hover:text-secondary transition-colors">
                    <Upload className="size-6" />
                  </div>
                  <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">Frictionless Ingest</CardTitle>
                  <CardDescription className="text-zinc-400 text-base">
                    Drop a 4k screenshot or a low-res screen recording. The engine upscales, cleans, and prepares the asset.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-32 px-6 border-t border-white/[0.02]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-100 mb-6">Simple pricing.</h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto font-medium">No complex subscriptions. Pay for what you export.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900/20 border-zinc-800/50">
                <CardHeader className="pb-8">
                  <CardTitle className="text-lg font-medium text-zinc-300">Single</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold tracking-tighter text-zinc-100">$20</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm text-zinc-400 mb-8 font-medium">
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> 1 cinematic export</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> 4K Resolution</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> Commercial Use</li>
                  </ul>
                  <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-primary/20 relative shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest z-10">
                  Popular
                </div>
                <CardHeader className="pb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
                  <CardTitle className="text-lg font-medium text-zinc-100 relative z-10">Bundle</CardTitle>
                  <div className="mt-4 relative z-10">
                    <span className="text-5xl font-bold tracking-tighter text-zinc-100">$75</span>
                    <span className="text-sm text-zinc-500 ml-2 font-medium">/ 5 videos</span>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-4 text-sm text-zinc-300 mb-8 font-medium">
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> 5 cinematic exports</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> Priority processing</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> Early access to features</li>
                  </ul>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer">
                    <Link href="/signup">Purchase Bundle</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/20 border-zinc-800/50">
                <CardHeader className="pb-8">
                  <CardTitle className="text-lg font-medium text-zinc-300">Studio</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold tracking-tighter text-zinc-100">$180</span>
                    <span className="text-sm text-zinc-500 ml-2 font-medium">/ 15 videos</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm text-zinc-400 mb-8 font-medium">
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> 15 cinematic exports</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> Dedicated VIP support</li>
                    <li className="flex items-center gap-3"><Check className="size-4 text-primary" /> Team collaboration</li>
                  </ul>
                  <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer">
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-32 px-6 border-t border-white/[0.02]">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter text-zinc-100 mb-12">Questions & Answers</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border border-zinc-800/60 bg-zinc-900/20 px-6 rounded-lg data-[state=open]:bg-zinc-900/40 transition-colors">
                <AccordionTrigger className="hover:no-underline text-zinc-200 hover:text-white py-6">How long does an export take?</AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-6 text-[15px]">
                  Most videos generate within 3 to 5 minutes depending on the complexity of the motion. Everything is processed on our cloud infrastructure.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border border-zinc-800/60 bg-zinc-900/20 px-6 rounded-lg data-[state=open]:bg-zinc-900/40 transition-colors">
                <AccordionTrigger className="hover:no-underline text-zinc-200 hover:text-white py-6">What inputs are supported?</AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-6 text-[15px]">
                  We support high-resolution static screenshots (up to 8K) and screen recordings (up to 2 minutes). Our AI infers layers from raw pixels.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border border-zinc-800/60 bg-zinc-900/20 px-6 rounded-lg data-[state=open]:bg-zinc-900/40 transition-colors">
                <AccordionTrigger className="hover:no-underline text-zinc-200 hover:text-white py-6">Are there commercial rights?</AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-6 text-[15px]">
                  Yes. All generated assets include full commercial licenses without any attribution requirements. Deploy them natively across any platform.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/[0.05] bg-[#0a0a0a]">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <span className="font-semibold text-xs text-zinc-400">M</span>
            </div>
            <span className="font-medium text-sm tracking-tight text-zinc-400">Morphix</span>
          </div>
          <div className="text-sm font-medium text-zinc-600">
            © {new Date().getFullYear()} Morphix.
          </div>
          <div className="flex gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">Twitter</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
