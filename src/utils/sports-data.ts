export interface Match {
  id: string;
  groundId: string;
  groundName: string;
  sport: 'Cricket' | 'Football' | 'Badminton';
  date: string;
  timeSlot: string;
  playersNeeded: number;
  playersJoined: number;
  organizer: string;
  status: 'open' | 'full' | 'completed' | 'live';
  type: 'Friendly' | 'Competitive';
  score?: {
    teamA: string;
    teamB: string;
    runsA?: number;
    runsB?: number;
    wicketsA?: number;
    wicketsB?: number;
    overs?: string;
  }
}

export interface PlayerStats {
  id: string;
  name: string;
  avatar: any;
  matches: number;
  runs: number;
  wickets: number;
  rating: number;
}

export interface Tournament {
  id: string;
  name: string;
  groundId: string;
  groundName: string;
  sport: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  registeredTeams: number;
  prizePool: number;
  entryFee: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  bannerImage: string;
}

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm-live-1',
    groundId: 'ground-a',
    groundName: 'Lord’s Cricket Arena',
    sport: 'Cricket',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '6 PM – 10 PM',
    playersNeeded: 0,
    playersJoined: 22,
    organizer: 'Pro League',
    status: 'live',
    type: 'Competitive',
    score: {
      teamA: 'Strikers',
      teamB: 'Titans',
      runsA: 145,
      wicketsA: 3,
      runsB: 12,
      wicketsB: 1,
      overs: '12.4'
    }
  },
  {
    id: 'm-1',
    groundId: 'ground-a',
    groundName: 'Lord’s Cricket Arena',
    sport: 'Cricket',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '6 PM – 10 PM',
    playersNeeded: 3,
    playersJoined: 8,
    organizer: 'Rahul Singh',
    status: 'open',
    type: 'Competitive',
  },
  {
    id: 'm-2',
    groundId: 'ground-b',
    groundName: 'Adelaide Practice Nets',
    sport: 'Cricket',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '9 AM – 12 PM',
    playersNeeded: 1,
    playersJoined: 3,
    organizer: 'Amit Kumar',
    status: 'open',
    type: 'Friendly',
  },
];

export const MOCK_LEADERBOARD: PlayerStats[] = [
  { id: 'p-1', name: 'Gokul', avatar: require('@/assets/images/gokul_avatar.png'), matches: 45, runs: 1250, wickets: 12, rating: 4.9 },
  { id: 'p-2', name: 'Sriraj', avatar: require('@/assets/images/sriraj_avatar.png'), matches: 38, runs: 980, wickets: 5, rating: 4.7 },
  { id: 'p-3', name: 'Sunil', avatar: require('@/assets/images/sunil_avatar.png'), matches: 52, runs: 450, wickets: 85, rating: 4.8 },
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't-1',
    name: 'Summer Cricket Blast 2026',
    groundId: 'ground-a',
    groundName: 'Lord’s Cricket Arena',
    sport: 'Cricket (T20)',
    startDate: '2026-05-10',
    endDate: '2026-05-20',
    maxTeams: 16,
    registeredTeams: 12,
    prizePool: 50000,
    entryFee: 2500,
    status: 'upcoming',
    bannerImage: 'https://images.unsplash.com/photo-1540747913346-19e3adbc4eae?w=800&q=80',
  },
  {
    id: 't-2',
    name: 'Corporate Cup - Adelaide',
    groundId: 'ground-b',
    groundName: 'Adelaide Practice Nets',
    sport: 'Box Cricket',
    startDate: '2026-04-25',
    endDate: '2026-04-26',
    maxTeams: 8,
    registeredTeams: 5,
    prizePool: 20000,
    entryFee: 1500,
    status: 'upcoming',
    bannerImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
  },
];
