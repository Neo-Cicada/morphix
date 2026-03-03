import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Upload, FileText, Clapperboard, Check } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground">M</div>
            <span className="font-semibold text-xl tracking-tight">Morphix</span>
          </div>
          <nav>
            <Button variant="ghost" className="text-sm font-medium hover:text-primary">Log in</Button>
            <Button className="font-semibold px-6 shadow-[0_0_20px_rgba(37,99,235,0.4)]">Get Early Access</Button>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="pt-32 pb-24 px-6 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto flex flex-col items-center text-center max-w-4xl relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent leading-tight">
              Transform your product <br /> into cinema.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
              Upload a screen recording, and let our AI engine generate a stunning, professional-grade marketing video ready for the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button size="lg" className="h-12 px-8 text-base shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105">
                Get Early Access
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
                See Pricing
              </Button>
            </div>

            {/* DEMO VIDEO PLACEHOLDER */}
            <div className="mt-20 w-full max-w-4xl aspect-video rounded-2xl border border-white/10 bg-black/50 shadow-2xl relative overflow-hidden ring-1 ring-white/5 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent mix-blend-overlay" />
              <div className="flex flex-col items-center gap-4 text-white/50">
                <Clapperboard className="size-16 opacity-50" />
                <p className="text-sm font-medium tracking-widest uppercase">Demo Video Placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Create production-quality assets without learning After Effects.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                  <Upload className="size-8" />
                </div>
                <h3 className="text-xl font-semibold">1. Upload Asset</h3>
                <p className="text-muted-foreground text-sm">Drop in your product screenshot or raw screen recording. The higher the resolution, the better.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="size-16 rounded-2xl bg-secondary/20 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/20">
                  <FileText className="size-8" />
                </div>
                <h3 className="text-xl font-semibold">2. Describe Vision</h3>
                <p className="text-muted-foreground text-sm">Tell our engine about the vibe, pacing, and core message you want to convey.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Clapperboard className="size-8" />
                </div>
                <h3 className="text-xl font-semibold">3. Get Video</h3>
                <p className="text-muted-foreground text-sm">Within minutes, receive a perfectly cut cinematic marketing video ready to deploy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-24 px-6 relative">
           <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Fair Pricing. Infinite Polish.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Pay per video. No monthly commitments.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              {/* Single */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Single Video</CardTitle>
                  <CardDescription>Perfect for a quick launch.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$20</span>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 1 AI cinematic video</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 4K Export</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Commercial Rights</li>
                  </ul>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white" variant="ghost">Get Started</Button>
                </CardContent>
              </Card>

              {/* Bundle 5 */}
              <Card className="bg-gradient-to-b from-primary/10 to-black/40 border-primary/20 shadow-[0_0_30px_rgba(37,99,235,0.1)] relative scale-105 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">Creator Bundle</CardTitle>
                  <CardDescription>Multi-platform campaigns.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$75</span>
                    <span className="text-sm text-muted-foreground ml-2">($15/video)</span>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 5 AI cinematic videos</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Priority Generation</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Commercial Rights</li>
                  </ul>
                  <Button className="w-full shadow-[0_0_15px_rgba(37,99,235,0.3)]">Get Access</Button>
                </CardContent>
              </Card>

              {/* Bundle 15 */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Studio Bundle</CardTitle>
                  <CardDescription>For growing agencies.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$180</span>
                    <span className="text-sm text-muted-foreground ml-2">($12/video)</span>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 15 AI cinematic videos</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Dedicated Support</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Commercial Rights</li>
                  </ul>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white" variant="ghost">Get Started</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 px-6 border-y border-white/5 bg-black/20">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/10">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">How long does an export take?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Most videos generate within 3 to 5 minutes depending on the complexity of the motion and resolution. We process everything in the cloud so you don't need a powerful machine.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/10">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">What kind of inputs can I use?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Currently, we support static app screenshots (PNG/JPG) up to 8K resolution, and screen recordings (MP4) up to 2 minutes long. The engine infers layers, UI elements, and motion.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/10">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">Can I use these commercially?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, absolutely. All videos generated on all tiers come with full commercial rights. You can use them for ads, App Store listings, and social media without attribution.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <div className="size-6 rounded bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">M</div>
            <span className="font-semibold text-sm tracking-tight">Morphix</span>
          </div>
          <div className="text-sm text-balance text-muted-foreground">
            © {new Date().getFullYear()} Morphix Inc. Transform your product into cinema.
          </div>
          <div className="flex gap-4 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
