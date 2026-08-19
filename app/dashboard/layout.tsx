import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Nunito_Sans } from 'next/font/google'
import '../globals.css'
import { getSession } from '@/lib/auth/session'
import { DashboardShell } from '@/components/dashboard-shell'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Dr. Dalia Portal · Management Dashboard',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  const fontVars = {
    '--font-display': 'var(--font-fraunces)',
    '--font-body': 'var(--font-nunito)',
  } as React.CSSProperties

  return (
    <html
      lang="en"
      className={`bg-background ${fraunces.variable} ${nunito.variable}`}
      style={fontVars}
    >
      <body className="min-h-dvh font-sans antialiased bg-background text-foreground">
        {!session ? (
          children
        ) : (
          <DashboardShell user={session}>{children}</DashboardShell>
        )}
      </body>
    </html>
  )
}
