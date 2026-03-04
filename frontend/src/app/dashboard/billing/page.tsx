import { Zap, Check, Sparkles, Receipt } from 'lucide-react';

const creditPacks = [
  { name: 'Starter', price: '$20', unit: '1 video', description: '1 cinematic marketing video', credits: 1, popular: false },
  { name: 'Builder', price: '$75', unit: '5 videos', description: '5 cinematic marketing videos', credits: 5, popular: true },
  { name: 'Studio', price: '$180', unit: '15 videos', description: '15 cinematic marketing videos', credits: 15, popular: false },
];

export default function BillingPage() {
  return (
    <div className="px-6 py-10 lg:px-8">

      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6] block mb-2">
          Credits
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">Billing</h1>
        <p className="text-sm text-[#888888] mt-1.5">Manage your credits and view transaction history.</p>
      </div>

      {/* Credit Balance Card */}
      <div
        className="relative rounded-2xl p-7 sm:p-8 mb-10 overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
      >
        {/* Aurora */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 70% -10%, rgba(59,130,246,0.1) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)' }}
        />
        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7, transparent)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="size-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <Zap className="h-4 w-4 text-[#3b82f6]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555555' }}>Current Balance</p>
          </div>
          <div className="flex items-end gap-3 mb-5">
            <span className="text-5xl font-extrabold tracking-tight text-white leading-none">3</span>
            <span className="text-sm pb-1 text-[#666666]">credits remaining</span>
          </div>
          <div className="max-w-sm">
            <div className="flex items-center justify-between text-xs text-[#555555] mb-2">
              <span>Used 2 of 5</span>
              <span>40%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
              <div
                className="h-full w-[40%] rounded-full transition-all"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Credit Packs — matches landing pricing section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold tracking-tight text-white">Buy Credits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-2xl p-6 transition-all duration-200 ${
                pack.popular ? 'pricing-card-featured' : ''
              }`}
              style={{
                background: '#0d0d0d',
                border: pack.popular ? 'none' : '1px solid #1e1e1e',
              }}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Best value
                  </span>
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-widest text-[#555555] mb-1 mt-1">{pack.name}</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-extrabold tracking-tight text-white">{pack.price}</span>
              </div>
              <p className="text-xs text-[#555555] mb-5">{pack.unit}</p>

              <div className="flex items-center gap-2 text-xs text-[#888888] mb-6">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                {pack.description}
              </div>

              <button
                disabled
                title="Payment integration coming soon"
                className="w-full rounded-xl py-2.5 text-xs font-semibold cursor-not-allowed transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1e1e1e',
                  color: '#444444',
                }}
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-base font-bold tracking-tight text-white mb-5">Transaction History</h2>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
        >
          {/* Table Header */}
          <div
            className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3"
            style={{ borderBottom: '1px solid #1a1a1a', background: 'rgba(255,255,255,0.015)' }}
          >
            {['Date', 'Pack', 'Amount', 'Credits', 'Status'].map((h) => (
              <p key={h} className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#444444' }}>
                {h}
              </p>
            ))}
          </div>

          {/* Empty State */}
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div
              className="size-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e' }}
            >
              <Receipt className="h-4 w-4" style={{ color: '#444444' }} />
            </div>
            <p className="text-sm font-semibold text-white mb-1">No transactions yet</p>
            <p className="text-xs" style={{ color: '#555555' }}>Your purchase history will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
