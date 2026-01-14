export type RankName = 'Intern' | 'PGY' | 'FR' | 'VS';

export type RankLevels = Record<RankName, number>;

export type Doctor = {
  id: number;
  name: string;
  rank: RankName;
  dept: string;
  monthlyTotal: number;
  targets: Record<string, number>;
  currentCases: Record<string, number>;
};

export type Treatment = {
  id: string;
  name: string;
  dept: string;
  minRank: RankName;
};

export type RequiredRank = {
  name: RankName;
  level: number;
};

export type DoctorWithDailyStats = Doctor & {
  dailyCount: number;
  totalScore?: number;
  urgencyScore?: number;
  loadScore?: number;
};

export type MatchError = { error: string };
