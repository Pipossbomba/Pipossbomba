import Image from 'next/image'
import Link from 'next/link'
import SectionReveal from '@/components/ui/SectionReveal'

export default function AtmosphericBreak() {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center overflow-hidden" aria-label="Citação editorial">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1589979481223-deb893043163?w=1920&q=80"
        alt="Vista aérea dos Açores ao anoitecer"
        fill
        className="object-cover"
        sizes="100vw"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-midnight/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight/40 to-midnight/20" />

      <div className="relative z-10 container-editorial">
        <SectionReveal direction="none">
          <div className="max-w-3xl">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold mb-8 block">
              Filosofia ERA Living Azores
            </span>
            <blockquote className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light text-parchment leading-tight text-balance">
              "Não vendemos propriedades.{' '}
              <em className="text-gold italic">Abrimos portas para uma vida que vale a pena viver."</em>
            </blockquote>
            <cite className="font-dm text-sm text-parchment/50 mt-8 block not-italic">
              — Rui Machado, Diretor ERA Living Azores
            </cite>

            <div className="mt-12">
              <Link href="/about" className="btn-ghost">
                A Nossa Filosofia
              </Link>
            </div>
          </div>
        </SectionReveal>

        {/* Decorative coordinates */}
        <div className="absolute bottom-8 right-10 hidden lg:block">
          <p className="font-mono text-[9px] tracking-[0.2em] text-parchment/20">
            38°32'N 28°37'W
          </p>
          <p className="font-mono text-[9px] tracking-[0.2em] text-parchment/20 mt-1">
            Ilha do Faial · Açores
          </p>
        </div>
      </div>
    </section>
  )
}
