export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  newTrip: '/new',
  explore: '/explore',
  guide: '/guide',
  trip: (id: string) => `/trip/${id}`,
  myTrips: '/trips',
  settings: '/settings',
  shared: (token: string) => `/shared/${token}`,
} as const

export const ROUTE_PATTERNS = {
  trip: '/trip/:tripId',
  shared: '/shared/:shareToken',
} as const
