import type { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:bg-accent focus:text-bg-primary focus:px-4 focus:py-2 focus:rounded-lg focus:text-[13px] focus:font-semibold"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 pb-16 lg:pb-0">
          <div className="max-w-[960px] mx-auto px-4 md:px-8 lg:px-10 py-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
