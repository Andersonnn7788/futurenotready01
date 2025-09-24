'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

function NavLink({ href, children, className = "" }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`
        relative inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isActive 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
        }
        ${className}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active state indicator */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-10" />
      )}
      
      {/* Hover state background */}
      <div className={`
        absolute inset-0 rounded-xl transition-opacity duration-200
        ${isActive 
          ? 'opacity-0' 
          : 'opacity-0 hover:opacity-100 bg-gradient-to-r from-gray-50 to-gray-100'
        }
      `} />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
      
      {/* Active state bottom indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-white/50 rounded-full" />
      )}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link 
            href="/" 
            className="flex items-center gap-3 sm:gap-4 text-gray-900 font-semibold group transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label="TalentMatch Home - Navigate to homepage"
          >
            <div className="relative">
              <Image 
                src="/TalentMatch%20logo.jpg" 
                alt="TalentMatch company logo" 
                width={48} 
                height={48} 
                className="rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-200"
                priority
              />
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              TalentMatch
            </span>
          </Link>
          
          {/* Navigation Section */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              <NavLink href="/">
                Home
              </NavLink>
              <NavLink href="/resume-screening">
                Resume Screening
              </NavLink>
              <NavLink href="/ai-interviewer">
                AI Interview
              </NavLink>
              <NavLink href="/onboarding-builder">
                Onboarding Builder
              </NavLink>
              <NavLink href="/candidate-follow-up">
                Candidate Follow Up
              </NavLink>
            </nav>

            {/* Sign In Button */}
            <Link
              href="/signin"
              className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            >
              SIGN IN
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </header>
  );
}
