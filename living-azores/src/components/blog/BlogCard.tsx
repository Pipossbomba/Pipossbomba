import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/data/blog'

interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

const categoryColors: Record<string, string> = {
  'Mundo Imobiliário': 'text-basalt',
  'Viver nos Açores': 'text-gold',
  'Investimento': 'text-midnight',
  'Compra e Venda': 'text-gold',
}

export default function BlogCard({ post, variant = 'default', className }: BlogCardProps) {
  if (variant === 'featured') {
    return (
      <article className={cn('group relative', className)}>
        <Link href={`/blog/${post.slug}`} className="block" aria-label={`Ler: ${post.title}`}>
          <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-midnight/5">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 65vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
              <span className="section-label mb-3 block">{post.category}</span>
              <h2 className="font-cormorant text-display-sm font-light text-parchment leading-tight text-balance">
                {post.title}
              </h2>
              <p className="font-dm text-sm text-parchment/70 mt-3 line-clamp-2 max-w-xl">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-4 mt-5">
                <span className="font-mono text-[10px] tracking-wide text-parchment/50 uppercase">
                  {post.author}
                </span>
                <span className="w-px h-3 bg-parchment/20" />
                <span className="font-mono text-[10px] tracking-wide text-parchment/50">
                  {formatDate(post.publishedAt)}
                </span>
                <span className="w-px h-3 bg-parchment/20" />
                <span className="font-mono text-[10px] tracking-wide text-parchment/50">
                  {post.readTime} min leitura
                </span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className={cn('group flex gap-4 py-5 border-b border-midnight/8 last:border-0', className)}>
        <Link href={`/blog/${post.slug}`} className="flex gap-4 w-full" aria-label={`Ler: ${post.title}`}>
          <div className="relative w-20 h-16 shrink-0 overflow-hidden bg-midnight/5">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn('font-mono text-[9px] tracking-widest uppercase', categoryColors[post.category])}>
              {post.category}
            </span>
            <h3 className="font-cormorant text-base font-medium text-midnight leading-snug mt-0.5 line-clamp-2 group-hover:text-basalt transition-colors">
              {post.title}
            </h3>
            <p className="font-mono text-[9px] text-midnight/40 mt-1">{post.readTime} min</p>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className={cn('group', className)}>
      <Link href={`/blog/${post.slug}`} className="block" aria-label={`Ler: ${post.title}`}>
        <div className="relative aspect-[16/9] overflow-hidden bg-midnight/5 mb-5">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <span className={cn('font-mono text-[9px] tracking-widest uppercase', categoryColors[post.category])}>
          {post.category}
        </span>
        <h3 className="font-cormorant text-xl font-medium text-midnight leading-snug mt-1.5 group-hover:text-basalt transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="font-dm text-sm text-midnight/60 mt-2 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-3 mt-4">
          <span className="font-mono text-[9px] text-midnight/40 tracking-wide">{formatDate(post.publishedAt)}</span>
          <span className="w-px h-2.5 bg-midnight/15" />
          <span className="font-mono text-[9px] text-midnight/40">{post.readTime} min leitura</span>
        </div>
      </Link>
    </article>
  )
}
