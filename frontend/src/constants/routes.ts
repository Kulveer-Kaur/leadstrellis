export const ROUTES = {
  login: '/login',
  dashboard: '/',
  leads: '/leads',
  pipeline: '/pipeline',
  properties: '/properties',
  viewings: '/viewings',
  communications: '/communications',
  automations: '/automations',
  reports: '/reports',
  settings: '/settings',
  proposal: '/p',
  /** Public: one-click answers from our emails (interested / later / not interested / unsubscribe). */
  respond: '/respond',
  setupAccount: '/setup-account',
} as const;

export const leadPath = (id: string) => `${ROUTES.leads}/${id}`;
export const propertyPath = (id: string) => `${ROUTES.properties}/${id}`;
