'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Início', labelEn: 'Home' },
  { href: '/properties', label: 'Propriedades', labelEn: 'Properties' },
  { href: '/about', label: 'Sobre', labelEn: 'About' },
  { href: '/blog', label: 'Editorial', labelEn: 'Editorial' },
  { href: '/contact', label: 'Contacto', labelEn: 'Contact' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<'PT' | 'EN'>('PT')
  const pathname = usePathname()

  const isHeroPage = pathname === '/'

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navBg = scrolled || !isHeroPage || menuOpen
  const textColor = navBg ? 'text-midnight' : 'text-parchment'
  const logoColor = navBg ? 'text-midnight' : 'text-parchment'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          navBg
            ? 'bg-parchment/95 backdrop-blur-md shadow-sm border-b border-midnight/8'
            : 'bg-transparent'
        )}
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="container-editorial h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className={cn('flex flex-col leading-none transition-colors duration-300', logoColor)}>
            <span className="font-cormorant text-xl font-light tracking-[0.05em]">Living Azores</span>
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase opacity-60 mt-0.5">with ERA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'nav-link relative py-1',
                  textColor,
                  pathname === link.href ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                )}
              >
                {lang === 'PT' ? link.label : link.labelEn}
                {pathname === link.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'PT' ? 'EN' : 'PT')}
              className={cn(
                'font-mono text-[10px] tracking-[0.15em] border px-2 py-1 transition-colors duration-200',
                navBg
                  ? 'border-midnight/20 text-midnight hover:border-gold hover:text-gold'
                  : 'border-parchment/30 text-parchment hover:border-parchment'
              )}
              aria-label="Mudar idioma"
            >
              {lang}
            </button>

            {/* CTA */}
            <Link
              href="/properties"
              className="hidden lg:inline-flex btn-primary text-xs"
              aria-label="Ver todas as propriedades"
            >
              {lang === 'PT' ? 'Ver Propriedades' : 'View Properties'}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn('lg:hidden flex flex-col gap-1.5 p-2 -mr-2', textColor)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className={cn('block h-px w-6 origin-center transition-colors duration-300', navBg ? 'bg-midnight' : 'bg-parchment')}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className={cn('block h-px w-4 transition-colors duration-300', navBg ? 'bg-midnight' : 'bg-parchment')}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className={cn('block h-px w-6 origin-center transition-colors duration-300', navBg ? 'bg-midnight' : 'bg-parchment')}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-midnight flex flex-col"
          >
            <div className="container-editorial flex flex-col justify-center h-full pt-20">
              <nav className="flex flex-col gap-2" aria-label="Menu mobile">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'font-cormorant text-5xl font-light text-parchment py-2 block transition-colors duration-200',
                        pathname === link.href ? 'text-gold' : 'hover:text-gold/80'
                      )}
                    >
                      {lang === 'PT' ? link.label : link.labelEn}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-16 border-t border-parchment/10 pt-8 flex items-center justify-between"
              >
                <div>
                  <p className="font-mono text-xs text-parchment/40 tracking-widest">CONTACTO</p>
                  <a href="tel:+351292292969" className="font-dm text-parchment/80 text-sm mt-1 block hover:text-parchment">
                    +351 292 292 969
                  </a>
                </div>
                <Link href="/properties" className="btn-ghost text-xs">
                  {lang === 'PT' ? 'Ver Propriedades' : 'View Properties'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
