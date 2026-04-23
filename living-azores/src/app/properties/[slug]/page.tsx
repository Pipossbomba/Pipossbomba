import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPropertyBySlug, getRelatedProperties, properties } from '@/data/properties'
import PropertyGallery from '@/components/properties/PropertyGallery'
import PropertySidebar from '@/components/properties/PropertySidebar'
import PropertyCard from '@/components/properties/PropertyCard'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const property = getPropertyBySlug(params.slug)
  if (!property) return {}
  return {
    title: property.name,
    description: property.description,
    openGraph: {
      images: [{ url: property.images[0], width: 1200, height: 800 }],
    },
  }
}

export default function PropertyPage({ params }: PageProps) {
  const property = getPropertyBySlug(params.slug)
  if (!property) notFound()

  const related = getRelatedProperties(params.slug, 3)

  return (
    <>
      {/* Gallery */}
      <PropertyGallery property={property} />

      {/* Main content */}
      <div className="bg-parchment">
        <div className="container-editorial py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left: details */}
            <div className="lg:col-span-7">
              {/* Breadcrumb */}
              <nav aria-label="Navegação estrutural" className="mb-8">
                <ol className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-midnight/30">
                  <li><a href="/properties" className="hover:text-gold transition-colors">Propriedades</a></li>
                  <li>·</li>
                  <li className="text-midnight/50">{property.island}</li>
                  <li>·</li>
                  <li className="text-gold">{property.name}</li>
                </ol>
              </nav>

              {/* Header */}
              <SectionReveal>
                <div className="mb-8">
                  <span className="section-label mb-3 block">
                    {property.island} · {property.type} · Ref. {property.reference}
                  </span>
                  <h1 className="font-cormorant text-4xl lg:text-5xl font-light text-midnight leading-tight">
                    {property.name}
                  </h1>
                  <p className="font-dm text-base text-midnight/60 mt-3">{property.view}</p>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-4 py-6 border-y border-midnight/10">
                  {[
                    { label: 'Área bruta', value: `${property.area} m²` },
                    { label: 'Quartos', value: property.bedrooms },
                    { label: 'Casas de banho', value: property.bathrooms },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/30 mb-1">{stat.label}</p>
                      <p className="font-cormorant text-2xl font-medium text-midnight">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </SectionReveal>

              {/* Description */}
              <SectionReveal delay={0.1} className="mt-10">
                <h2 className="font-cormorant text-2xl font-light text-midnight mb-5">Sobre a Propriedade</h2>
                <div className="font-dm text-base text-midnight/70 leading-relaxed space-y-4">
                  {property.longDescription.split('\n\n').map((para, i) => {
                    if (para.startsWith('**') && para.endsWith('**')) {
                      return (
                        <h3 key={i} className="font-dm font-semibold text-midnight mt-6">
                          {para.replace(/\*\*/g, '')}
                        </h3>
                      )
                    }
                    return <p key={i}>{para.replace(/\*\*/g, '')}</p>
                  })}
                </div>
              </SectionReveal>

              {/* Features */}
              <SectionReveal delay={0.2} className="mt-12">
                <h2 className="font-cormorant text-2xl font-light text-midnight mb-6">Características</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-gold mt-0.5 shrink-0">◈</span>
                      <span className="font-dm text-sm text-midnight/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </SectionReveal>

              {/* Additional info */}
              <SectionReveal delay={0.3} className="mt-12 p-6 bg-midnight/3 border border-midnight/8">
                <h2 className="font-cormorant text-xl font-light text-midnight mb-5">Informação Adicional</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Ano de construção', value: property.yearBuilt },
                    { label: 'Terreno', value: property.landArea ? `${property.landArea} m²` : 'N/A' },
                    { label: 'Ilha', value: property.island },
                    { label: 'Tipo', value: property.type },
                    { label: 'Quartos', value: property.bedrooms },
                    { label: 'WC', value: property.bathrooms },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/30">{item.label}</dt>
                      <dd className="font-dm text-sm text-midnight mt-0.5">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionReveal>

              {/* Map placeholder */}
              <SectionReveal delay={0.35} className="mt-10">
                <h2 className="font-cormorant text-2xl font-light text-midnight mb-5">Localização</h2>
                <div
                  className="relative h-64 bg-midnight/5 border border-midnight/10 overflow-hidden flex items-center justify-center"
                  role="img"
                  aria-label={`Localização de ${property.name} em ${property.island}`}
                >
                  <div className="text-center">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-midnight/30 mb-2">Coordenadas</p>
                    <p className="font-mono text-sm text-midnight/50">
                      {property.coordinates.lat.toFixed(4)}°N, {Math.abs(property.coordinates.lng).toFixed(4)}°W
                    </p>
                    <p className="font-dm text-xs text-midnight/30 mt-2">{property.island}, Açores, Portugal</p>
                  </div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=60')] bg-cover bg-center opacity-20" />
                </div>
                <p className="font-mono text-[9px] text-midnight/30 mt-2">
                  * Mapa interativo disponível após contacto com consultor
                </p>
              </SectionReveal>
            </div>

            {/* Right: sticky sidebar */}
            <div className="lg:col-span-5">
              <PropertySidebar property={property} />
            </div>
          </div>
        </div>
      </div>

      {/* Related properties */}
      <section className="py-20 lg:py-28 bg-parchment/50 border-t border-midnight/8">
        <div className="container-editorial">
          <SectionReveal className="mb-12">
            <span className="section-label mb-3 block">Pode também interessar-lhe</span>
            <h2 className="section-title">Propriedades Relacionadas</h2>
          </SectionReveal>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {related.map((prop) => (
              <StaggerItem key={prop.id}>
                <PropertyCard property={prop} className="shadow-card" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  )
}
