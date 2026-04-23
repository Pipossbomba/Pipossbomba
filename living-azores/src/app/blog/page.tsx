import type { Metadata } from 'next'
import { blogPosts, getFeaturedPost } from '@/data/blog'
import BlogCard from '@/components/blog/BlogCard'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Editorial',
  description: 'Análises, guias e perspectivas sobre o mercado imobiliário e estilo de vida nos Açores.',
}

const categories = ['Todos', 'Mundo Imobiliário', 'Viver nos Açores', 'Investimento', 'Compra e Venda']

export default function BlogPage() {
  const featured = getFeaturedPost()
  const rest = blogPosts.filter((p) => !p.featured)

  return (
    <>
      {/* Header */}
      <div className="bg-midnight pt-40 pb-24">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <SectionReveal className="lg:col-span-7">
              <span className="section-label text-parchment/40 mb-4 block">Editorial</span>
              <h1 className="section-title-light">
                Conhecimento<br />
                <em className="font-light italic text-gold">que faz a diferença</em>
              </h1>
              <p className="font-dm text-base text-parchment/50 mt-4 max-w-md">
                Análises aprofundadas, guias práticos e perspectivas sobre o mercado imobiliário e
                o estilo de vida excepcional dos Açores.
              </p>
            </SectionReveal>
            <SectionReveal className="lg:col-span-5" direction="right">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 border border-parchment/15 text-parchment/40 hover:border-gold/50 hover:text-gold transition-colors duration-200"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>

      {/* Featured article */}
      <section className="bg-parchment" aria-labelledby="featured-article">
        <div className="container-editorial pt-16 pb-0">
          <SectionReveal>
            <span className="section-label mb-5 block" id="featured-article">Artigo em Destaque</span>
          </SectionReveal>
        </div>
        <div className="container-editorial pb-0">
          <SectionReveal>
            <BlogCard post={featured} variant="featured" />
          </SectionReveal>
        </div>
      </section>

      {/* Editorial grid */}
      <section className="py-20 lg:py-28 bg-parchment" aria-labelledby="articles-title">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Main articles — 8 cols */}
            <div className="lg:col-span-8">
              <SectionReveal className="mb-10">
                <h2 id="articles-title" className="font-cormorant text-2xl font-light text-midnight border-b border-midnight/10 pb-4">
                  Todos os Artigos
                </h2>
              </SectionReveal>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                {rest.map((post) => (
                  <StaggerItem key={post.id}>
                    <BlogCard post={post} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* Sidebar — 4 cols */}
            <aside className="lg:col-span-4">
              <SectionReveal direction="right">
                {/* By category */}
                <div className="mb-10">
                  <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 mb-5">
                    Por Categoria
                  </h3>
                  {['Mundo Imobiliário', 'Viver nos Açores', 'Investimento', 'Compra e Venda'].map((cat) => {
                    const count = blogPosts.filter((p) => p.category === cat).length
                    return (
                      <button
                        key={cat}
                        className="w-full flex items-center justify-between py-3 border-b border-midnight/8 text-left group"
                      >
                        <span className="font-dm text-sm text-midnight/70 group-hover:text-midnight transition-colors">{cat}</span>
                        <span className="font-mono text-[10px] text-midnight/30">{count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Latest */}
                <div>
                  <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 mb-5">
                    Mais Recentes
                  </h3>
                  {blogPosts.slice(0, 3).map((post) => (
                    <BlogCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>

                {/* Newsletter CTA */}
                <div className="mt-10 bg-midnight p-6">
                  <p className="font-mono text-[9px] tracking-widest uppercase text-parchment/30 mb-2">Newsletter</p>
                  <h3 className="font-cormorant text-xl font-light text-parchment mb-3">
                    Mercado em movimento
                  </h3>
                  <p className="font-dm text-xs text-parchment/50 mb-5">
                    Análise mensal do mercado imobiliário açoriano, directa para o seu email.
                  </p>
                  <input
                    type="email"
                    placeholder="o.seu@email.com"
                    className="w-full bg-transparent border border-parchment/15 px-3 py-2 font-dm text-sm text-parchment placeholder:text-parchment/20 focus:border-gold focus:outline-none mb-3"
                    aria-label="Email para newsletter"
                  />
                  <button className="btn-primary w-full justify-center text-xs">
                    Subscrever
                  </button>
                </div>
              </SectionReveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
