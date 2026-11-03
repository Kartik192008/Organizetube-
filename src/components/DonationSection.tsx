import { useState } from 'react';
import { Coffee, Heart } from 'lucide-react';
import DonationModal from '@/components/DonationModal';
import { DONATION_TIERS, type DonationTier } from '@/lib/donationTiers';

export default function DonationSection() {
  const [selected, setSelected] = useState<DonationTier | null>(null);

  return (
    <section className="flex flex-col gap-8 border-t-2 border-primary-900 py-12">
      <div className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-600">
          <Heart className="h-4 w-4 fill-current" />
          Organizer stays free
        </span>
        <h2 className="text-4xl text-primary-900 sm:text-5xl">Buy us a coffee</h2>
        <p className="max-w-xl text-base leading-relaxed text-primary-600">
          Every feature here is free for learners. If Organizer helps you study, pick a cup to
          keep the project going.
        </p>
      </div>

      <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {DONATION_TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setSelected(tier)}
            className={`group flex flex-col items-center gap-3 border-2 border-primary-900 p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#FF5A1F] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-200 ${tier.cardClassName}`}
          >
            <span className="relative flex h-24 items-end justify-center">
              {Array.from({ length: tier.steamCount }, (_, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="absolute bottom-full h-6 w-0.5 animate-steam bg-current"
                  style={{
                    left: `${50 + (index - (tier.steamCount - 1) / 2) * 18}%`,
                    animationDelay: `${index * 0.6}s`,
                  }}
                />
              ))}
              <Coffee
                className={`${tier.iconClassName} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                strokeWidth={1.75}
              />
            </span>
            <span className="font-display text-4xl leading-none">
              <span className="text-lg align-top">₹</span>
              {tier.amount}
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide">{tier.name}</span>
            <span className="text-xs leading-snug opacity-80">{tier.blurb}</span>
          </button>
        ))}
      </div>

      {selected && <DonationModal tier={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
