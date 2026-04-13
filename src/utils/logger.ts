const isDev = import.meta.env.DEV

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug('[debug]', ...args)
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[info]', ...args)
    }
  },
  warn: (...args: unknown[]): void => {
    console.warn('[warn]', ...args)
  },
  error: (...args: unknown[]): void => {
    console.error('[error]', ...args)
  },
}
