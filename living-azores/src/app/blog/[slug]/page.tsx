import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getBlogPostBySlug, getLatestPosts, blogPosts } from '@/data/blog'
import { formatDate } from '@/lib/utils'
import BlogCard from '@/components/blog/BlogCard'
import SectionReveal from '@/components/ui/SectionReveal'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [{ url: post.image }] },
  }
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getBlogPostBySlug(params.slug)
  if (!post) notFound()

  const related = getLatestPosts(3, params.slug)

  const paragraphs = post.content.split('\n\n')

  return (
    <>
      {/* Hero */}
      <div className="relative h-[65vh] min-h-[500px] flex items-end overflow-hidden bg-midnight">
        <Image
          src={post.image}
          alt={post.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="relative z-10 container-editorial pb-20">
          <SectionReveal>
            <nav aria-label="Navegação estrutural" className="mb-6">
              <ol className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-parchment/30">
                <li><Link href="/blog" className="hover:text-gold transition-colors">Editorial</Link></li>
                <li>·</li>
                <li className="text-gold">{post.category}</li>
              </ol>
            </nav>
            <h1 className="font-cormorant text-4xl lg:text-5xl xl:text-6xl font-light text-parchment leading-tight max-w-3xl text-balance">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-6">
              <div className="w-8 h-8 rounded-full bg-parchment/20 flex items-center justify-center">
                <span className="font-cormorant text-sm text-parchment">{post.author.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <p className="font-dm text-sm text-parchment/80">{post.author}</p>
                <p className="font-mono text-[9px] text-parchment/40">{post.authorRole}</p>
              </div>
              <span className="w-px h-6 bg-parchment/15" />
              <p className="font-mono text-[9px] text-parchment/40">{formatDate(post.publishedAt)}</p>
              <span className="w-px h-6 bg-parchment/15" />
              <p className="font-mono text-[9px] text-parchment/40">{post.readTime} min leitura</p>
            </div>
          </SectionReveal>
        </div>
      </div>

      {/* Content */}
      <div className="bg-parchment">
        <div className="container-editorial py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Article body */}
            <article className="lg:col-span-7 lg:col-start-2">
              {/* Excerpt/lead */}
              <p className="font-cormorant text-xl lg:text-2xl font-light text-midnight/80 leading-relaxed border-l-2 border-gold pl-6 mb-10">
                {post.excerpt}
              </p>

              {/* Content */}
              <div className="prose-editorial space-y-5">
                {paragraphs.map((para, i) => {
                  if (para.startsWith('**') && para.endsWith('**')) {
                    return (
                      <h2 key={i} className="font-cormorant text-2xl font-medium text-midnight mt-10 mb-4">
                        {para.replace(/\*\*/g, '')}
                      </h2>
                    )
                  }
                  return (
                    <p key={i} className="font-dm text-base text-midnight/70 leading-relaxed">
                      {para.replace(/\*\*/g, '')}
                    </p>
                  )
                })}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-midnight/10">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 border border-midnight/15 text-midnight/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author bio */}
              <div className="mt-10 p-6 bg-midnight/3 border border-midnight/8 flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-basalt/20 flex items-center justify-center shrink-0">
                  <span className="font-cormorant text-lg text-basalt">
                    {post.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-dm text-sm font-medium text-midnight">{post.author}</p>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-gold mt-0.5">{post.authorRole}</p>
                  <p className="font-dm text-sm text-midnight/60 mt-2 leading-relaxed">
                    Especialista ERA Living Azores com vasta experiência no mercado imobiliário das ilhas do grupo central dos Açores.
                  </p>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <SectionReveal direction="right">
                <div className="lg:sticky lg:top-28 space-y-8">
                  {/* CTA */}
                  <div className="bg-midnight p-6">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-parchment/30 mb-2">
                      Interessado?
                    </p>
                    <h3 className="font-cormorant text-xl font-light text-parchment mb-3">
                      Fale com um consultor
                    </h3>
                    <p className="font-dm text-xs text-parchment/50 mb-5">
                      A nossa equipa está disponível para esclarecer todas as suas dúvidas.
                    </p>
                    <Link href="/contact" className="btn-primary w-full justify-center text-xs">
                      Contactar
                    </Link>
                  </div>

                  {/* Related posts */}
                  <div>
                    <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 mb-5">
                      Leia Também
                    </h3>
                    {related.slice(0, 3).map((p) => (
                      <BlogCard key={p.id} post={p} variant="compact" />
                    ))}
                  </div>
                </div>
              </SectionReveal>
            </aside>
          </div>
        </div>
      </div>

      {/* Related articles */}
      <section className="py-20 bg-parchment/50 border-t border-midnight/8">
        <div className="container-editorial">
          <SectionReveal className="mb-12">
            <span className="section-label mb-3 block">Artigos Relacionados</span>
            <h2 className="section-title">Continue a ler</h2>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
