'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import CountUp from '@/components/ui/CountUp'
import SectionReveal from '@/components/ui/SectionReveal'

const cards = [
  {
    stat: 23,
    statSuffix: '%',
    statPrefix: '+',
    statLabel: 'valorização imobiliária 2022–2025',
    title: 'Mercado em Valorização',
    body: 'O mercado imobiliário dos Açores registou uma valorização consistente e sustentada, impulsionada pela escassez de stock de qualidade e crescente procura internacional.',
    detail: 'Estabilidade da UE · Proteção jurídica · Registo predial sólido',
    icon: '↑',
  },
  {
    stat: 4.2,
    statSuffix: '/5',
    statPrefix: '',
    statLabel: 'índice de qualidade de vida (Mercer 2024)',
    title: 'Qualidade de Vida Atlântica',
    body: 'Ar puro, crime praticamente inexistente, natureza intocada, gastronomia de nível, comunidade internacional acolhedora — os Açores oferecem uma alternativa real à vida urbana.',
    detail: 'Saúde · Segurança · Educação · Natureza',
    icon: '◈',
    decimals: 1,
  },
  {
    stat: 45,
    statSuffix: '%',
    statPrefix: '',
    statLabel: 'compradores estrangeiros no segmento premium',
    title: 'Procura Internacional Crescente',
    body: 'Americanos, canadianos e norte-europeus descobriram os Açores como destino de vida e investimento. O arquipélago posiciona-se no mapa da mobilidade global de alto padrão.',
    detail: 'EUA · Canadá · Alemanha · Holanda · Reino Unido',
    icon: '◎',
  },
]

export default function WhyAzores() {
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 lg:py-36 bg-midnight overflow-hidden" ref={ref} aria-labelledby="why-azores-title">
      <div className="container-editorial">
        {/* Header */}
        <SectionReveal className="mb-16 lg:mb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <span className="section-label text-parchment/50 mb-4 block">Porquê os Açores</span>
            <h2
              id="why-azores-title"
              className="section-title-light text-balance"
            >
              A convergência perfeita de<br />
              <em className="font-light italic text-gold">natureza, qualidade e investimento</em>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="font-dm text-base text-parchment/50 leading-relaxed max-w-md">
              Num mundo de incertezas, os Açores representam uma ancora de estabilidade europeia com
              um estilo de vida que o resto do mundo perdeu.
            </p>
          </div>
        </SectionReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-parchment/8">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
              onHoverStart={() => setActiveCard(i)}
              onHoverEnd={() => setActiveCard(null)}
              className="relative bg-midnight p-10 lg:p-12 cursor-default transition-colors duration-300 group hover:bg-basalt/30"
            >
              {/* Corner icon */}
              <span className="absolute top-6 right-8 font-mono text-2xl text-parchment/10 group-hover:text-gold/20 transition-colors duration-300">
                {card.icon}
              </span>

              {/* Stat */}
              <div className="mb-6">
                <div className="stat-number">
                  <span className="text-parchment/30 text-3xl">{card.statPrefix}</span>
                  <CountUp
                    end={card.stat}
                    duration={2000}
                    decimals={card.decimals}
                    className="text-gold"
                  />
                  <span className="text-parchment/30 text-2xl">{card.statSuffix}</span>
                </div>
                <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-parchment/30 mt-2">
                  {card.statLabel}
                </p>
              </div>

              {/* Content */}
              <div className="border-t border-parchment/8 pt-6">
                <h3 className="font-cormorant text-2xl font-light text-parchment mb-3">
                  {card.title}
                </h3>
                <p className="font-dm text-sm text-parchment/50 leading-relaxed">
                  {card.body}
                </p>
                <p className="font-mono text-[9px] tracking-wider text-gold/50 mt-5">
                  {card.detail}
                </p>
              </div>

              {/* Active indicator */}
              <motion.div
                initial={false}
                animate={{ scaleX: activeCard === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-px bg-gold origin-left"
              />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
