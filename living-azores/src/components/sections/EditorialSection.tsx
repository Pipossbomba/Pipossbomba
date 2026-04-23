import Link from 'next/link'
import BlogCard from '@/components/blog/BlogCard'
import SectionReveal, { StaggerContainer, StaggerItem } from '@/components/ui/SectionReveal'
import { getLatestPosts } from '@/data/blog'

export default function EditorialSection() {
  const posts = getLatestPosts(3)

  return (
    <section className="py-24 lg:py-36 bg-parchment/50 border-t border-midnight/8" aria-labelledby="editorial-title">
      <div className="container-editorial">
        <SectionReveal className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="section-label mb-4 block">Editorial</span>
            <h2 id="editorial-title" className="section-title max-w-md">
              Conhecimento que<br />
              <em className="font-light italic text-basalt">faz a diferença</em>
            </h2>
          </div>
          <Link href="/blog" className="btn-outline shrink-0">
            Ver Todo o Editorial
            <span className="ml-1">→</span>
          </Link>
        </SectionReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {posts.map((post) => (
            <StaggerItem key={post.id}>
              <BlogCard post={post} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
