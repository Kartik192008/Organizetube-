export type DonationTier = {
  id: string;
  amount: number;
  name: string;
  blurb: string;
  cardClassName: string;
  iconClassName: string;
  steamCount: number;
};

export const DONATION_TIERS: DonationTier[] = [
  {
    id: 'espresso',
    amount: 30,
    name: 'Espresso',
    blurb: 'A quick shot to keep the lights on.',
    cardClassName: 'bg-surface text-primary-900',
    iconClassName: 'h-8 w-8',
    steamCount: 1,
  },
  {
    id: 'latte',
    amount: 50,
    name: 'Latte',
    blurb: 'A smooth thank-you for the study streak.',
    cardClassName: 'bg-accent-100 text-accent-800',
    iconClassName: 'h-10 w-10',
    steamCount: 2,
  },
  {
    id: 'cappuccino',
    amount: 100,
    name: 'Cappuccino',
    blurb: 'Keeps the late-night study sessions going.',
    cardClassName: 'bg-accent-200 text-accent-900',
    iconClassName: 'h-12 w-12',
    steamCount: 2,
  },
  {
    id: 'mocha',
    amount: 150,
    name: 'Mocha',
    blurb: 'Fuel for the next batch of features.',
    cardClassName: 'bg-accent-500 text-white',
    iconClassName: 'h-14 w-14',
    steamCount: 3,
  },
  {
    id: 'mega',
    amount: 450,
    name: 'Mega Brew',
    blurb: 'Help keep Organizer free for every learner.',
    cardClassName: 'bg-primary-900 text-accent-500',
    iconClassName: 'h-20 w-20',
    steamCount: 3,
  },
];
