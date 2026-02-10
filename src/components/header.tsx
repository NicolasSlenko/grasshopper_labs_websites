"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Menu, LogOut, LayoutDashboard, User, Upload, Info } from "lucide-react"
import {
  SignedIn,
  SignedOut,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./theme-provider"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold hidden sm:inline-block">ResumeHub</span>
          </Link>

          {/* Centered Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

            <NavButton href="/about-us" icon={Info} label="About" />

            <SignedIn>
              <NavButton href="/" icon={Upload} label="Upload" />
              <NavButton href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavButton href="/profile" icon={User} label="Profile" />
            </SignedIn>

          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ModeToggle />

            <SignedOut>
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Log in</Link>
                </Button>
                <Button className="hidden md:inline-flex" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2">
                {/* Logout Button in Nav Line as requested, or keep near UserButton? 
                    User asked to "make them all more in the center... button styyle... of logout"
                    I'll add logout to the center group? No, logout usually stays right.
                    The user said "profile, dashboa, and logout... Can we make them all more in the center".
                    Putting logout in the center nav is non-standard and could be annoying if accidental.
                    I will put it in the center group as the last item to strictly follow "make them all more in the center".
                */}
                <div className="hidden md:block">
                  <SignOutButton redirectUrl="/">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </SignOutButton>
                </div>

                <div className="pl-2 border-l ml-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </SignedIn>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavButton({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "gap-2",
        isActive && "bg-muted font-medium"
      )}
      asChild
    >
      <Link href={href}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
