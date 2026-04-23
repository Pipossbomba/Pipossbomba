'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const headline = 'Onde o Atlântico\nEncontra o Lar.'
const words = headline.split(/(\s|\n)/)

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [])

  return (
    <section
      className="relative h-screen min-h-[600px] max-h-[1000px] flex flex-col justify-end overflow-hidden"
      aria-label="Secção principal"
    >
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1589979481223-deb893043163?w=1920&q=80"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/40 via-midnight/20 to-midnight/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight/30 to-transparent" />

      {/* Grain texture */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 container-editorial pb-20 lg:pb-28">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="w-8 h-px bg-gold" />
            <span className="section-label text-parchment/70">Faial & Pico · Açores, Portugal</span>
          </motion.div>

          {/* Headline word-by-word reveal */}
          <h1 className="font-cormorant text-display-xl font-light text-parchment leading-[1.0] mb-6" aria-label={headline}>
            {words.map((word, i) => {
              if (word === '\n') return <br key={i} />
              if (word === ' ') return <span key={i}> </span>
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + i * 0.08,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="inline-block will-change-transform"
                >
                  {word}
                </motion.span>
              )
            })}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4 }}
            className="font-dm text-lg md:text-xl text-parchment/75 max-w-xl leading-relaxed mb-10"
          >
            Propriedades de excepção em duas das ilhas mais extraordinárias da Europa.
            Vivência atlântica, qualidade de vida superior, investimento seguro.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/properties" className="btn-primary">
              Ver Propriedades
            </Link>
            <Link href="/about" className="btn-ghost">
              A Nossa História
            </Link>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-16 grid grid-cols-3 divide-x divide-parchment/15 border-t border-parchment/15 pt-8 max-w-lg"
        >
          {[
            { value: '6', label: 'Ilhas representadas' },
            { value: '15+', label: 'Anos de experiência' },
            { value: '€1.2B', label: 'Em transações' },
          ].map((stat) => (
            <div key={stat.label} className="px-5 first:pl-0">
              <p className="font-mono text-xl text-parchment font-light">{stat.value}</p>
              <p className="font-dm text-[11px] text-parchment/50 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        className="absolute bottom-8 right-10 hidden lg:flex flex-col items-center gap-3"
        aria-hidden="true"
      >
        <span className="writing-vertical font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/40">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-12 bg-gradient-to-b from-parchment/40 to-transparent"
        />
      </motion.div>

      {/* Island indicators */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute top-1/2 -translate-y-1/2 right-10 hidden xl:flex flex-col gap-3"
      >
        {['Faial', 'Pico'].map((island) => (
          <Link
            key={island}
            href={`/properties?island=${island}`}
            className="writing-vertical font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/30 hover:text-gold transition-colors"
          >
            {island}
          </Link>
        ))}
      </motion.div>
    </section>
  )
}
