'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserData } from '@/types/User'
import Image from 'next/image'
import { cn } from '@/lib/utils'
// import { signOut } from 'next-auth/react'

interface AppHeaderProps {
  className?: string
  user?: UserData | null
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getNavItems = () => {
    if (true) {
      return [
        { name: 'AI Counsel', link: '/legal-agent' },
        { name: '事務所', link: '/self-firm/management' },
      ]
    } else {
      return [
        { name: '登入', link: '/login' },
      ]
    }
  }

  const navItems = getNavItems()

  return (
    <header className={`w-full fixed top-0 bg-transparent flex justify-center items-center left-0 right-0 z-50 transition-all duration-300 ${className}`}>
      {/* 動態寬度的毛玻璃效果导航栏 */}
      <nav className={cn(`backdrop-blur-md bg-white/30 rounded-lg mt-2 transition-all duration-300`,
        isScrolled
          ? 'w-11/12 sm:w-1/2 h-12 sm:h-14'
          : 'w-full max-w-7xl mx-4 h-12 sm:h-14'
      )}>
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <Image
                  src="/logo.svg"
                  alt="Legal Lens Logo"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
              </Link>
            </div>

            {/* Desktop 导航项 */}
            <div className="hidden sm:flex items-center">
              {navItems.map((item, index) => {
                const isActive = pathname === item.link
                return (
                  <Link
                    key={`${item.name}-${index}`}
                    href={item.link}
                    className={cn(`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md`,
                      isActive
                        ? 'text-gray-900 dark:text-white bg-gray-100/60 dark:bg-gray-800/60'
                        : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/40 dark:hover:bg-gray-800/40'
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
              {true && (
                <button
                  onClick={() => {/* signOut() */}}
                  className={cn(`text-sm cursor-pointer font-medium transition-all duration-200 px-3 py-1.5 rounded-md`,
                    'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/40 dark:hover:bg-gray-800/40'
                  )}
                >
                  <span className="text-nowrap font-medium">登出</span>
                </button>
              )}
            </div>

            {/* Mobile 漢堡選單按鈕 */}
            <button
              className="sm:hidden flex flex-col items-center justify-center w-6 h-6 space-y-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className={cn("w-4 h-0.5 bg-gray-600 dark:bg-gray-400 transition-all duration-200",
                isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
              )}></span>
              <span className={cn("w-4 h-0.5 bg-gray-600 dark:bg-gray-400 transition-all duration-200",
                isMobileMenuOpen ? "opacity-0" : ""
              )}></span>
              <span className={cn("w-4 h-0.5 bg-gray-600 dark:bg-gray-400 transition-all duration-200",
                isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
              )}></span>
            </button>
          </div>
        </div>

        {/* Mobile 下拉選單 */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 mt-2 mx-4 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 rounded-lg border border-white/20 shadow-lg">
            <div className="py-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.link
                return (
                  <Link
                    key={`mobile-${item.name}-${index}`}
                    href={item.link}
                    className={cn(`block px-4 py-3 text-sm font-medium transition-all duration-200`,
                      isActive
                        ? 'text-gray-900 dark:text-white bg-gray-100/60 dark:bg-gray-800/60'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/40 dark:hover:bg-gray-800/40'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}
                {true && (
                <button
                  onClick={() => {/* signOut() */}}
                  className={cn(`block px-4 py-3 text-sm font-medium transition-all duration-200`,
                    'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/40 dark:hover:bg-gray-800/40'
                  )}
                >
                  <span className="text-nowrap font-medium">登出</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}


