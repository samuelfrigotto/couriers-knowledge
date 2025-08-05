// src/app/core/interfaces/api.interfaces.ts

// ====== EVALUATION INTERFACES ======
export interface Evaluation {
  id: number;
  rating: number;
  notes?: string;
  tags: string[];
  role?: string;
  hero_id?: number;
  match_id?: number;
  created_at: string;
  updated_at: string;
  author_id: number;
  player_id: number;
  target_steam_id: string;
  target_player_name: string;
  steam_username?: string;
  avatar_url?: string;
}

export interface CreateEvaluationRequest {
  target_steam_id?: string;
  target_player_name?: string;
  hero_id?: number;
  notes?: string;
  tags?: string[];
  rating: number;
  role?: string;
  match_id?: number;
}

export interface UpdateEvaluationRequest {
  rating?: number;
  notes?: string;
  tags?: string[];
  role?: string;
  hero_id?: number;
}

export interface EvaluationResponse {
  success: boolean;
  evaluation?: Evaluation;
  message?: string;
  error?: string;
}

export interface EvaluationsListResponse {
  success: boolean;
  evaluations: Evaluation[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface EvaluationStatus {
  canEvaluate: boolean;
  evaluationsToday: number;
  dailyLimit: number;
  isPremium: boolean;
  timeUntilReset?: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ImportEvaluation {
  target_steam_id?: string;
  target_player_name?: string;
  hero_id?: number;
  notes?: string;
  tags?: string[];
  rating: number;
  created_at?: string;
}

export interface ExportEvaluationsResponse {
  success: boolean;
  shareCode?: string;
  evaluations?: Evaluation[];
  message?: string;
}

export interface ImportEvaluationsRequest {
  shareCode?: string;
  evaluations?: ImportEvaluation[];
  replaceExisting?: boolean;
}

export interface ImportEvaluationsResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  message?: string;
}

// ====== USER INTERFACES ======
export interface UserProfile {
  id: number;
  steamUsername: string;
  avatarUrl?: string;
  accountStatus: 'Free' | 'Premium';
  created_at: string;
  isImmortal?: boolean;
  immortalRank?: number;
  immortalRegion?: 'americas' | 'europe' | 'se_asia' | 'china';
  mmr?: number;
  isAdmin?: boolean;
  apiCallsToday?: number;
  apiLimit?: number;
  usesConsumed?: number;
  usesAllowed?: number;
  usesRemaining?: number;
  callsPerUse?: number;
}

export interface UserStats {
  totalEvaluations?: number;
  averageRating?: number;
  mostUsedTags?: string[];
  receivedEvaluationsCount?: number;
  averageReceivedRating?: number;
  selfAverageRating?: number;
  totalMatches?: number;
  winsLast20?: number;
  averageMatchTime?: number;
  averageKda?: {
    kills: string;
    deaths: string;
    assists: string;
  };
  mostUsedHeroId?: string;
  mostFacedHeroId?: string;
  evaluationPercentage?: number;
  tiltAnalysis?: {
    matchesWithLowRatedTeammates: number;
    winsWithLowRatedTeammates: number;
    tiltWinRate: number | null;
  };
}

export interface UserStatsResponse {
  success: boolean;
  stats: UserStats;
  error?: string;
}

// ====== MATCH INTERFACES ======
export interface MatchPlayer {
  account_id: number;
  player_slot: number;
  hero_id: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0: number;
  backpack_1: number;
  backpack_2: number;
  kills: number;
  deaths: number;
  assists: number;
  leaver_status: number;
  last_hits: number;
  denies: number;
  gold_per_min: number;
  xp_per_min: number;
  level: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  gold: number;
  gold_spent: number;
  scaled_hero_damage: number;
  scaled_tower_damage: number;
  scaled_hero_healing: number;
  steam_id_64?: string;
  steam_username?: string;
  avatar_url?: string;
  is_already_evaluated?: boolean;
  evaluation_data?: Evaluation;
}

export interface MatchDetails {
  match_id: number;
  barracks_status_dire: number;
  barracks_status_radiant: number;
  cluster: number;
  dire_score: number;
  duration: number;
  engine: number;
  first_blood_time: number;
  game_mode: number;
  human_players: number;
  leagueid: number;
  lobby_type: number;
  match_seq_num: number;
  negative_votes: number;
  positive_votes: number;
  radiant_score: number;
  radiant_win: boolean;
  start_time: number;
  tower_status_dire: number;
  tower_status_radiant: number;
  version: number;
  replay_salt: number;
  series_id: number;
  series_type: number;
  players: MatchPlayer[];
  patch: number;
  region: number;
  replay_url: string;
}

export interface MatchHistoryResponse {
  success: boolean;
  matches: MatchDetails[];
  error?: string;
}

// ====== STEAM INTERFACES ======
export interface SteamPlayer {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  commentpermission: number;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff: number;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamPlayersResponse {
  success: boolean;
  players: SteamPlayer[];
  error?: string;
}

// ====== FRIENDS INTERFACES ======
export interface FriendStatus {
  steam_id: string;
  steam_username: string;
  avatar_url: string;
  profile_url?: string;
  is_online?: boolean;
  already_invited?: boolean;
  invited_at?: string;
  joined_at?: string;
}

export interface FriendsListResponse {
  success: boolean;
  friends: FriendStatus[];
  error?: string;
}

export interface InviteFriendRequest {
  steamId: string;
}

export interface InviteFriendResponse {
  success: boolean;
  message: string;
  error?: string;
}

// ====== STATUS INTERFACES ======
export interface StatusPlayer {
  slot: number;
  name: string;
  isBot: boolean;
  time: string;
  ping: number;
  loss: number;
  state: string;
  rate: number;
  team: 'radiant' | 'dire';
  hasEvaluations: boolean;
  evaluations: Evaluation[];
  stats?: {
    totalEvaluations: number;
    averageRating: number;
    lastEvaluated: string;
    allTags: string[];
    mostCommonRole: string | null;
  } | null;
}

export interface StatusParseResponse {
  success: boolean;
  gameState: {
    raw: string;
    translated: string;
  };
  statistics: {
    totalPlayers: number;
    humanPlayers: number;
    botPlayers: number;
    evaluatedPlayers: number;
  };
  teams: {
    radiant: StatusPlayer[];
    dire: StatusPlayer[];
  };
  evaluationsSummary: {
    totalFound: number;
    playersWithEvaluations: number;
    playerNames: string[];
  };
  error?: string;
  details?: string;
}

// ====== GENERIC API RESPONSE ======
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}



// src/app/interfaces/api-responses.interface.ts

// ===== INTERFACES DE AVALIAÇÃO =====



export interface UpdateEvaluationRequest {
  hero_id?: number;
  rating?: number;
  notes?: string;
  tags?: string[];
}

export interface EvaluationStatus {
  total_evaluations: number;
  average_rating: number;
  rating_distribution: RatingDistribution;
  recent_evaluations: Evaluation[];
  tags_usage: TagUsage[];
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface TagUsage {
  tag: string;
  count: number;
}

// ===== INTERFACES DE USUÁRIO =====
export interface UserProfile {
  id: number;
  steam_id: string;
  steam_username: string;
  email: string;
  avatar_url: string | null;
  profile_url: string | null;
  account_status: 'Free' | 'Premium';
  created_at: string;
  updated_at: string;

  // Immortal fields
  is_immortal?: boolean;
  immortal_rank?: number;
  immortal_region?: 'americas' | 'europe' | 'se_asia' | 'china';
  mmr?: number;

  // Admin fields
  is_admin?: boolean;

  // Usage limits
  api_calls_today?: number;
  api_limit?: number;
  uses_consumed?: number;
  uses_allowed?: number;
  uses_remaining?: number;
  calls_per_use?: number;
}

export interface UserStats {
  // Evaluation stats
  total_evaluations: number;
  average_rating: number;
  most_used_tags: string[];
  received_evaluations_count: number;
  average_received_rating: number;
  self_average_rating: number;

  // Match stats
  total_matches: number;
  wins_last_20: number;
  average_match_time: number;
  average_kda: {
    kills: string;
    deaths: string;
    assists: string;
  };
  most_used_hero_id: string | null;
  most_faced_hero_id: string | null;
  evaluation_percentage: number;

  // Tilt analysis
  tilt_analysis: {
    matches_with_low_rated_teammates: number;
    wins_with_low_rated_teammates: number;
    tilt_win_rate: number | null;
  };
}

// ===== INTERFACES DE RESPOSTA DA API =====
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ===== INTERFACES DE IMPORTAÇÃO/EXPORTAÇÃO =====
export interface ImportEvaluation {
  target_steam_id?: string;
  target_player_name?: string;
  hero_id?: number;
  notes?: string;
  tags?: string[];
  rating: number;
  created_at?: string;
}

export interface ExportData {
  version: string;
  exported_by: string;
  exported_at: string;
  total_evaluations: number;
  evaluations: ImportEvaluation[];
}

export interface ImportPreview {
  total: number;
  version: string;
  exported_by: string;
  exported_at: string;
  valid_evaluations: number;
  invalid_evaluations: number;
  duplicates: number;
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  errors: string[];
}

// ===== INTERFACES DE PARTIDAS =====
export interface MatchPlayer {
  hero_id: number;
  name: string;
  rank: string;
  kills: number;
  deaths: number;
  assists: number;
  networth: number;
  team: 'radiant' | 'dire';
}

export interface Match {
  id: number;
  match_id: string;
  user_hero_id: number;
  user_won: boolean;
  duration: number;
  created_at: string;
  radiant_score: number;
  dire_score: number;
  match_date: string;
  players: MatchPlayer[];
}

export interface MatchHistory {
  matches: Match[];
  total_matches: number;
  last_updated: string;
}

// ===== INTERFACES DE STATUS/LIVE MATCH =====
export interface StatusPlayer {
  name: string;
  steam_id: string;
  hero_id: number | null;
  team: 'radiant' | 'dire';
  kills: number;
  deaths: number;
  assists: number;
  networth: number;
  level: number;
  evaluation_data?: {
    average_rating: number;
    total_evaluations: number;
    most_common_tags: string[];
  };
}

export interface StatusParseResponse {
  game_state: string;
  match_id: string | null;
  duration: number;
  radiant_score: number;
  dire_score: number;
  players: StatusPlayer[];
  server_info: {
    server: string;
    version: string;
  };
}

// ===== INTERFACES DE FILTROS =====
export interface EvaluationFilter {
  hero_id?: number;
  rating?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  player_name?: string;
}

export interface MatchFilter {
  hero_id?: number;
  result?: 'win' | 'loss';
  duration_min?: number;
  duration_max?: number;
  date_from?: string;
  date_to?: string;
}

// ===== INTERFACES DE FORMULÁRIOS =====
export interface FilterFormData {
  heroId: number | null;
  rating: number | null;
  tags: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface SearchFormData {
  query: string;
  filters: EvaluationFilter;
}
