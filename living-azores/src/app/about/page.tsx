import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'
import CountUp from '@/components/ui/CountUp'

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'A ERA Living Azores — a agência imobiliária premium especializada nas ilhas do Faial e Pico, Açores.',
}

const team = [
  {
    name: 'Rui Machado',
    role: 'Diretor ERA Living Azores',
    bio: 'Nascido no Faial, Rui lidera a agência com 18 anos de experiência no mercado imobiliário açoriano. Especialista em propriedades premium e atração de investimento internacional.',
    initials: 'RM',
  },
  {
    name: 'Catarina Sousa',
    role: 'Consultora Sénior · Faial',
    bio: 'Com passagem por Lisboa e Londres, Catarina traz uma perspectiva cosmopolita ao mercado açoriano. Especializada em atender clientes estrangeiros e expatriados.',
    initials: 'CS',
  },
  {
    name: 'Pedro Vieira',
    role: 'Gestor de Investimentos',
    bio: 'MBA em Finanças pela NOVA SBE, Pedro aconselha investidores sobre as oportunidades de rendimento e valorização no arquipélago.',
    initials: 'PV',
  },
  {
    name: 'Ana Bruges',
    role: 'Consultora · Pico',
    bio: 'Especialista em arquitetura vernacular e património açoriano, Ana acompanha processos de restauro e reconversão de imóveis históricos no Pico.',
    initials: 'AB',
  },
]

const timeline = [
  { year: '2005', title: 'Fundação', desc: 'ERA Living Azores abre portas em Horta, Faial.' },
  { year: '2010', title: 'Expansão ao Pico', desc: 'Abertura de representação na ilha do Pico.' },
  { year: '2015', title: 'Certificação Internacional', desc: 'Entrada na rede ERA Portugal e reconhecimento europeu.' },
  { year: '2019', title: 'Segmento Premium', desc: 'Foco estratégico no mercado imobiliário de alto padrão.' },
  { year: '2022', title: 'Record de Transações', desc: 'Melhor ano de sempre: €48M em transações mediadas.' },
  { year: '2025', title: 'Living Azores', desc: 'Rebranding para ERA Living Azores, afirmando a identidade editorial.' },
]

const stats = [
  { value: 20, suffix: '+', label: 'Anos de experiência' },
  { value: 450, suffix: '+', label: 'Propriedades transacionadas' },
  { value: 1.2, suffix: 'B€', label: 'Em transações mediadas', decimals: 1 },
  { value: 42, suffix: '%', label: 'Clientes internacionais' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[500px] flex items-end overflow-hidden bg-midnight">
        <Image
          src="https://images.unsplash.com/photo-1567617788386-28ccceff6b13?w=1920&q=80"
          alt="Vista da Horta, Faial"
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="relative z-10 container-editorial pb-20">
          <SectionReveal>
            <span className="section-label text-parchment/40 mb-4 block">Sobre nós</span>
            <h1 className="section-title-light max-w-2xl">
              Uma agência construída<br />
              <em className="font-light italic text-gold">com a alma dos Açores</em>
            </h1>
          </SectionReveal>
        </div>
      </div>

      {/* Manifesto */}
      <section className="py-24 lg:py-36 bg-parchment">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <SectionReveal className="lg:col-span-6">
              <span className="section-label mb-5 block">Manifesto</span>
              <h2 className="font-cormorant text-4xl lg:text-5xl font-light text-midnight leading-tight mb-8">
                Acreditamos que a melhor propriedade<br />
                <em className="italic text-basalt">não é a mais cara — é a mais certa.</em>
              </h2>
              <div className="space-y-4 font-dm text-base text-midnight/70 leading-relaxed">
                <p>
                  A ERA Living Azores nasceu da convicção de que o Faial e o Pico merecem uma agência à sua altura.
                  Não uma franquia genérica, mas uma equipa profundamente enraizada na cultura e no território açoriano.
                </p>
                <p>
                  Durante duas décadas, mediamos sonhos — de quem quer deixar a cidade e encontrar sossego atlântico,
                  de investidores que percebem que os Açores são uma das últimas oportunidades reais na Europa,
                  de portugueses do continente e da diáspora que procuram um regresso diferente.
                </p>
                <p>
                  A nossa promessa é simples: tratamos cada transação como se fosse a nossa própria casa.
                  Com rigor, honestidade e o conhecimento íntimo de quem vive e ama estas ilhas.
                </p>
              </div>
            </SectionReveal>

            <div className="lg:col-span-6">
              <SectionReveal direction="right">
                <div className="relative">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85"
                      alt="Paisagem dos Açores"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  {/* Floating stat card */}
                  <div className="absolute -bottom-6 -left-6 bg-midnight p-6 shadow-editorial">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/30 mb-1">
                      Desde
                    </p>
                    <p className="font-cormorant text-4xl text-gold">2005</p>
                    <p className="font-dm text-xs text-parchment/50 mt-1">No mercado açoriano</p>
                  </div>
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-basalt" aria-label="Estatísticas">
        <div className="container-editorial">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-parchment/10">
            {stats.map((stat, i) => (
              <SectionReveal key={stat.label} delay={i * 0.1} className="text-center lg:px-10">
                <p className="stat-number text-gold">
                  <CountUp end={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </p>
                <p className="font-dm text-sm text-parchment/50 mt-2">{stat.label}</p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24 lg:py-36 bg-parchment" aria-labelledby="team-title">
        <div className="container-editorial">
          <SectionReveal className="mb-16">
            <span className="section-label mb-4 block">A Nossa Equipa</span>
            <h2 id="team-title" className="section-title max-w-md">
              Especialistas com<br />
              <em className="font-light italic text-basalt">raízes no Atlântico</em>
            </h2>
          </SectionReveal>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <div className="group">
                  <div className="relative aspect-square overflow-hidden bg-midnight/5 mb-5">
                    <div className="absolute inset-0 flex items-center justify-center bg-basalt/10 group-hover:bg-basalt/20 transition-colors duration-300">
                      <span className="font-cormorant text-6xl font-light text-basalt">
                        {member.initials}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-cormorant text-xl font-medium text-midnight">{member.name}</h3>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-gold mt-0.5 mb-3">{member.role}</p>
                  <p className="font-dm text-sm text-midnight/60 leading-relaxed">{member.bio}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 lg:py-36 bg-midnight" aria-labelledby="timeline-title">
        <div className="container-editorial">
          <SectionReveal className="mb-16">
            <span className="section-label text-parchment/40 mb-4 block">A Nossa História</span>
            <h2 id="timeline-title" className="section-title-light max-w-md">
              Duas décadas de<br />
              <em className="italic text-gold">mercado açoriano</em>
            </h2>
          </SectionReveal>

          <div className="relative">
            <div className="absolute left-24 top-0 bottom-0 w-px bg-parchment/10" aria-hidden="true" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <SectionReveal key={item.year} delay={i * 0.1}>
                  <div className="flex gap-8 items-start">
                    <div className="w-24 text-right shrink-0">
                      <span className="font-mono text-sm text-gold">{item.year}</span>
                    </div>
                    <div className="relative pt-0.5">
                      <div className="w-2 h-2 rounded-full bg-gold absolute -left-9 top-2" aria-hidden="true" />
                      <h3 className="font-cormorant text-xl font-medium text-parchment">{item.title}</h3>
                      <p className="font-dm text-sm text-parchment/50 mt-1">{item.desc}</p>
                    </div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 border-t border-midnight/10 bg-parchment">
        <div className="container-editorial">
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20">
            {[
              { label: 'Membro Certificado', value: 'ERA Portugal' },
              { label: 'Licença AMI', value: '123456' },
              { label: 'NIF', value: '512 345 678' },
              { label: 'Segurado por', value: 'Fidelidade / AXA' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30">{item.label}</p>
                <p className="font-cormorant text-xl text-midnight mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-basalt py-20">
        <div className="container-editorial text-center">
          <h2 className="font-cormorant text-3xl lg:text-4xl font-light text-parchment mb-6">
            Pronto para encontrar a sua propriedade?
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/properties" className="btn-primary">
              Ver Propriedades
            </Link>
            <Link href="/contact" className="btn-ghost">
              Falar Connosco
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
