import { Zap, Check, Sparkles, Receipt } from 'lucide-react';

const creditPacks = [
  {
    name: 'Single',
    price: '$20',
    credits: 1,
    description: '1 marketing video',
    popular: false,
  },
  {
    name: 'Creator Bundle',
    price: '$75',
    credits: 5,
    description: '5 marketing videos',
    popular: true,
  },
  {
    name: 'Studio Bundle',
    price: '$180',
    credits: 15,
    description: '15 marketing videos',
    popular: false,
  },
];

export default function BillingPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your credits and view transaction history.</p>
      </div>

      {/* Current Balance Card */}
      <div className="relative rounded-xl border border-[#222222] bg-[#161616] p-6 sm:p-8 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[250px] h-[150px] bg-blue-500/[0.05] blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-blue-400" />
            <p className="text-sm font-medium text-gray-400">Current Balance</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-white tracking-tight">3</span>
            <span className="text-sm text-gray-500">credits remaining</span>
          </div>
          <div className="max-w-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Used 2 of 5</span>
              <span>40%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-xl border p-5 transition-all ${
                pack.popular
                  ? 'border-blue-500/30 bg-blue-500/[0.04]'
                  : 'border-[#222222] bg-[#161616] hover:border-[#2a2a2a]'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    <Sparkles className="h-2.5 w-2.5" />
                    Popular
                  </span>
                </div>
              )}
              
              <p className="text-sm font-medium text-white mb-1">{pack.name}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-white">{pack.price}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Check className="h-3 w-3 text-blue-400" />
                {pack.description}
              </div>
              
              <button
                disabled
                className="w-full rounded-lg border border-[#222222] bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed opacity-50 transition-all"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Transaction History</h2>
        <div className="rounded-xl border border-[#222222] bg-[#161616] overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 border-b border-[#222222] bg-white/[0.02]">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
          </div>
          
          {/* Empty State */}
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="size-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3 border border-[#222222]">
              <Receipt className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-600 mt-1">Your purchase history will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
