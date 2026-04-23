import Hero from '@/components/hero/Hero'
import WhyAzores from '@/components/sections/WhyAzores'
import FeaturedProperties from '@/components/sections/FeaturedProperties'
import AtmosphericBreak from '@/components/sections/AtmosphericBreak'
import EditorialSection from '@/components/sections/EditorialSection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyAzores />
      <FeaturedProperties />
      <AtmosphericBreak />
      <EditorialSection />
    </>
  )
}
