export type MicroChallengeTrigger = {
  period?: Array<'morning' | 'afternoon' | 'evening'>;
  minTasksDue?: number;
  maxDurationMinutes?: number;
  mood?: string[];
  habitTrend?: 'upward' | 'steady' | 'downward';
  weather?: string[];
};

export type MicroChallengeDefinition = {
  id: string;
  title: string;
  description: string;
  microCopy: string;
  durationMinutes: number;
  rewardXp: number;
  category: 'focus' | 'wellness' | 'mindset' | 'connection';
  triggers: MicroChallengeTrigger;
};

export const microChallengeCatalog: MicroChallengeDefinition[] = [
  {
    id: 'focus-pulse',
    title: 'Focus Pulse',
    description: 'Silence notifications and attack one high-impact task for 12 minutes.',
    microCopy: 'Pick one task, set a 12-minute timer, and sprint without context switching.',
    durationMinutes: 12,
    rewardXp: 15,
    category: 'focus',
    triggers: {
      period: ['morning', 'afternoon'],
      minTasksDue: 1,
    },
  },
  {
    id: 'hydration-reset',
    title: 'Hydration Reset',
    description: 'Drink a glass of water and stretch for one minute.',
    microCopy: 'Hydrate + stretch: a 90-second reset to keep energy steady.',
    durationMinutes: 2,
    rewardXp: 8,
    category: 'wellness',
    triggers: {
      period: ['afternoon', 'evening'],
    },
  },
  {
    id: 'gratitude-snap',
    title: 'Gratitude Snap',
    description: 'Identify one thing going well and send a thank-you message.',
    microCopy: 'Pause, reflect on a win, and send a 2-sentence appreciation note.',
    durationMinutes: 4,
    rewardXp: 12,
    category: 'mindset',
    triggers: {
      mood: ['okay', 'bad', 'terrible'],
    },
  },
  {
    id: 'movement-loop',
    title: 'Movement Loop',
    description: 'Walk a small lap or climb stairs for 3 minutes.',
    microCopy: 'Walk a quick loop or pace indoors for 3 minutes to boost circulation.',
    durationMinutes: 3,
    rewardXp: 10,
    category: 'wellness',
    triggers: {
      period: ['afternoon'],
    },
  },
  {
    id: 'micro-plan',
    title: 'Micro Plan',
    description: 'Write down the next two actions for your top goal.',
    microCopy: 'Grab a sticky note: jot the next two concrete moves for your top goal.',
    durationMinutes: 5,
    rewardXp: 14,
    category: 'focus',
    triggers: {
      minTasksDue: 2,
    },
  },
  {
    id: 'wind-down-journal',
    title: 'Wind Down Journal',
    description: 'Capture one win and one lesson from today.',
    microCopy: 'Before wrap-up, list a win + a lesson to close the loop.',
    durationMinutes: 6,
    rewardXp: 18,
    category: 'mindset',
    triggers: {
      period: ['evening'],
    },
  },
  {
    id: 'connection-nudge',
    title: 'Connection Nudge',
    description: 'Ping a teammate or friend with a quick check-in.',
    microCopy: 'Send a quick “thinking of you” message—it takes 60 seconds.',
    durationMinutes: 1,
    rewardXp: 9,
    category: 'connection',
    triggers: {
      period: ['afternoon', 'evening'],
    },
  },
  {
    id: 'habit-preview',
    title: 'Habit Preview',
    description: 'Visualize completing your keystone habit later today.',
    microCopy: 'Close eyes, picture where/when you’ll do your keystone habit today.',
    durationMinutes: 2,
    rewardXp: 11,
    category: 'mindset',
    triggers: {
      habitTrend: 'downward',
    },
  },
];

