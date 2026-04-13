export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  newTrip: '/new',
  trip: (id: string) => `/trip/${id}`,
  history: '/history',
  shared: (token: string) => `/shared/${token}`,
} as const

export const ROUTE_PATTERNS = {
  trip: '/trip/:tripId',
  shared: '/shared/:shareToken',
} as const
