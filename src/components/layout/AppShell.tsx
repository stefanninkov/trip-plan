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
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0">
          <div className="max-w-[960px] mx-auto px-4 md:px-8 lg:px-10 py-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
