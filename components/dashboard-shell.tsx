'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarCheck2,
  Stethoscope,
  BarChart3,
  Users2,
  LogOut,
  ExternalLink,
  Menu,
  X,
  HeartPulse,
  Shield,
  UserCheck,
} from 'lucide-react'
import type { UserRole } from '@/lib/db'

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    userId: string
    username: string
    displayName: string
    role: UserRole
  }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/dashboard/login')
      router.refresh()
    } catch {
      router.push('/dashboard/login')
    }
  }

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      name: 'Consultation Sessions',
      href: '/dashboard/consultations',
      icon: Stethoscope,
      adminOnly: false, // Staff can view, Admin can edit
    },
    {
      name: 'Bookings & Receipts',
      href: '/dashboard/bookings',
      icon: CalendarCheck2,
      adminOnly: false,
    },
    {
      name: 'Analytics & Traffic',
      href: '/dashboard/analytics',
      icon: BarChart3,
      adminOnly: false,
    },
    {
      name: 'Team & Staff',
      href: '/dashboard/users',
      icon: Users2,
      adminOnly: true, // Only admin can access user management
    },
  ]

  const filteredNav = navItems.filter((item) => !item.adminOnly || user.role === 'admin')

  return (
    <div className="min-h-screen bg-muted/30 text-foreground flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <HeartPulse className="size-5" />
          </div>
          <span className="font-serif font-bold text-lg text-foreground">Dr. Dalia Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <HeartPulse className="size-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-foreground leading-tight">
                Dr. Dalia Portal
              </h1>
              <p className="text-xs text-muted-foreground">Management Console</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 rounded-3xl bg-secondary/50 border border-border/80 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                  <Shield className="size-2.5" />
                  ADMIN
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                  <UserCheck className="size-2.5" />
                  STAFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon className={`size-4.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/en"
            target="_blank"
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="size-3.5" />
              Live Website
            </span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md">/en</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="size-4" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-foreground/20 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  )
}
