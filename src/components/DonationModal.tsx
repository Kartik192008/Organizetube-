import { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '@/components/Modal';
import type { DonationTier } from '@/lib/donationTiers';

type DonationModalProps = {
  tier: DonationTier;
  onClose: () => void;
};

export default function DonationModal({ tier, onClose }: DonationModalProps) {
  const [thanked, setThanked] = useState(false);

  if (thanked) {
    return (
      <Modal title="Thank you!" onClose={onClose}>
        <div className="flex flex-col items-start gap-5">
          <span className="flex h-12 w-12 items-center justify-center bg-accent-500 text-white">
            <Check className="h-6 w-6" strokeWidth={3} />
          </span>
          <p className="text-base leading-relaxed text-primary-600">
            Your {tier.name} cup means a lot. Online payments are not connected yet, so nothing
            was charged.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-11 bg-primary-900 px-5 text-sm font-semibold text-surface transition-colors hover:bg-accent-600"
          >
            Back to my courses
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Donate ₹${tier.amount}`} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-2 border-primary-900 px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
              Your cup
            </span>
            <span className="font-display text-3xl leading-none text-primary-900">{tier.name}</span>
          </div>
          <span className="font-display text-5xl leading-none text-accent-600">₹{tier.amount}</span>
        </div>
        <p className="text-sm leading-relaxed text-primary-600">{tier.blurb}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setThanked(true)}
            className="flex h-12 items-center justify-center bg-accent-500 font-semibold text-white transition-colors hover:bg-accent-600"
          >
            Donate ₹{tier.amount}
          </button>
          <p className="text-center text-xs text-primary-500">
            Checkout is a preview. No payment is taken yet.
          </p>
        </div>
      </div>
    </Modal>
  );
}
