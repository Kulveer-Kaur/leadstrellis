export const queryKeys = {
  dashboard: {
    summary: (filters: object) => ['dashboard', 'summary', filters] as const,
    hotspots: ['dashboard', 'hotspots'] as const,
    matches: (segment: string) => ['dashboard', 'matches', segment] as const,
    recentLeads: (tab: string, search: string) => ['dashboard', 'recent-leads', tab, search] as const,
    activity: ['dashboard', 'activity'] as const,
    viewings: ['dashboard', 'viewings'] as const,
    automations: ['dashboard', 'automations'] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (params: object) => ['leads', 'list', params] as const,
    stage: (status: string) => ['leads', 'stage', status] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    timeline: (id: string) => ['leads', 'timeline', id] as const,
    messages: (id: string) => ['leads', 'messages', id] as const,
  },
  properties: {
    all: ['properties'] as const,
    list: (params: object) => ['properties', 'list', params] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
  },
  viewings: {
    all: ['viewings'] as const,
    list: (upcoming: boolean) => ['viewings', 'list', upcoming] as const,
  },
  conversations: (search: string) => ['conversations', search] as const,
  users: ['users'] as const,
  reports: {
    forecast: ['reports', 'forecast'] as const,
    emailStats: ['reports', 'email-stats'] as const,
    likelyToWin: ['reports', 'likely-to-win'] as const,
    insights: ['reports', 'insights'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
};
