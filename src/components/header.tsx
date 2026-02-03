"use client"

import Link from "next/link"
import { FileText, Menu } from "lucide-react"
import {
  SignedIn,
  SignedOut,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./theme-provider"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">ResumeHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Upload Resume
            </Link>
            <Link href="/about-us" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
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
                <Button variant="ghost" className="hidden md:inline-flex" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button variant="outline" className="hidden md:inline-flex" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <SignOutButton redirectUrl="/">
                  <Button variant="ghost">
                    Log out
                  </Button>
                </SignOutButton>
                <UserButton />
              </div>
            </SignedIn>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
