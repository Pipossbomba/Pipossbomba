import { Suspense } from 'react'
import type { Metadata } from 'next'
import { properties } from '@/data/properties'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilter from '@/components/properties/PropertyFilter'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'

export const metadata: Metadata = {
  title: 'Propriedades',
  description: 'Explore o nosso portefólio de propriedades premium nas ilhas do Faial e Pico, Açores.',
}

interface PageProps {
  searchParams: {
    island?: string
    type?: string
    price?: string
    badge?: string
  }
}

const priceRangeMap: Record<string, [number, number]> = {
  'Até €300.000': [0, 300000],
  '€300.000 – €500.000': [300000, 500000],
  '€500.000 – €800.000': [500000, 800000],
  'Acima de €800.000': [800000, Infinity],
}

export default function PropertiesPage({ searchParams }: PageProps) {
  const { island, type, price, badge } = searchParams

  const filtered = properties.filter((p) => {
    if (island && p.island !== island) return false
    if (type && p.type !== type) return false
    if (badge && p.badge !== badge) return false
    if (price && priceRangeMap[price]) {
      const [min, max] = priceRangeMap[price]
      if (p.price < min || p.price > max) return false
    }
    return true
  })

  const isFiltered = island || type || price || badge

  return (
    <>
      {/* Page header */}
      <div className="bg-midnight pt-40 pb-20">
        <div className="container-editorial">
          <SectionReveal>
            <span className="section-label text-parchment/40 mb-4 block">Portefólio</span>
            <h1 className="section-title-light">
              Propriedades<br />
              <em className="font-light italic text-gold">Faial & Pico</em>
            </h1>
            <p className="font-dm text-base text-parchment/50 mt-4 max-w-lg">
              Uma selecção rigorosa de propriedades nas duas ilhas mais extraordinárias do grupo central dos Açores.
            </p>
          </SectionReveal>
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <PropertyFilter />
      </Suspense>

      {/* Grid */}
      <section className="py-16 lg:py-24 bg-parchment">
        <div className="container-editorial">
          {/* Results count */}
          <div className="flex items-center justify-between mb-10">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-midnight/40">
              {filtered.length} {filtered.length === 1 ? 'propriedade' : 'propriedades'} {isFiltered ? 'encontradas' : 'disponíveis'}
            </p>
            {isFiltered && (
              <a href="/properties" className="font-mono text-[10px] tracking-widest uppercase text-gold hover:text-gold-light transition-colors">
                Limpar filtros ×
              </a>
            )}
          </div>

          {filtered.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((property, i) => (
                <StaggerItem key={property.id}>
                  <PropertyCard
                    property={property}
                    priority={i < 3}
                    className="shadow-card"
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-24">
              <p className="font-cormorant text-3xl text-midnight/30 mb-4">Nenhuma propriedade encontrada</p>
              <p className="font-dm text-sm text-midnight/40 mb-8">
                Tente ajustar os filtros ou{' '}
                <a href="/contact" className="text-gold underline underline-offset-2">contacte-nos</a>{' '}
                para uma pesquisa personalizada.
              </p>
              <a href="/properties" className="btn-outline">
                Ver Todas as Propriedades
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <div className="bg-basalt py-16 lg:py-20">
        <div className="container-editorial text-center">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-foam/50 mb-4">Não encontrou o que procura?</p>
          <h2 className="font-cormorant text-3xl lg:text-4xl font-light text-parchment mb-6">
            Temos acesso a propriedades exclusivas<br className="hidden md:block" />
            <em className="italic text-foam"> não listadas publicamente</em>
          </h2>
          <a href="/contact" className="btn-primary">
            Falar com um Consultor
          </a>
        </div>
      </div>
    </>
  )
}
