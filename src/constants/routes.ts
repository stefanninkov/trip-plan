export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  newTrip: '/new',
  explore: '/explore',
  trip: (id: string) => `/trip/${id}`,
  myTrips: '/trips',
  shared: (token: string) => `/shared/${token}`,
} as const

export const ROUTE_PATTERNS = {
  trip: '/trip/:tripId',
  shared: '/shared/:shareToken',
} as const
