import Link from 'next/link'
import PropertyCard from '@/components/properties/PropertyCard'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'
import { getFeaturedProperties } from '@/data/properties'

export default function FeaturedProperties() {
  const properties = getFeaturedProperties(3)

  return (
    <section className="py-24 lg:py-36 bg-parchment" aria-labelledby="featured-properties-title">
      <div className="container-editorial">
        {/* Header */}
        <SectionReveal className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="section-label mb-4 block">Propriedades em Destaque</span>
            <h2 id="featured-properties-title" className="section-title max-w-md">
              Selecção Exclusiva<br />
              <em className="font-light italic text-basalt">ERA Living Azores</em>
            </h2>
          </div>
          <div className="shrink-0">
            <Link href="/properties" className="btn-outline">
              Ver Todas as Propriedades
              <span className="ml-1">→</span>
            </Link>
          </div>
        </SectionReveal>

        {/* Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {properties.map((property, i) => (
            <StaggerItem key={property.id}>
              <PropertyCard
                property={property}
                priority={i === 0}
                className="shadow-card"
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <SectionReveal delay={0.3} className="mt-16 text-center">
          <p className="font-dm text-sm text-midnight/50 mb-5">
            Mais de 40 propriedades disponíveis em Faial e Pico
          </p>
          <Link href="/properties" className="btn-primary">
            Explorar o Portefólio Completo
          </Link>
        </SectionReveal>
      </div>
    </section>
  )
}
