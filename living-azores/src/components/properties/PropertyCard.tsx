'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Property } from '@/data/properties'

interface PropertyCardProps {
  property: Property
  priority?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'featured'
}

const badgeStyles: Record<string, string> = {
  Novo: 'bg-basalt text-foam',
  Exclusivo: 'bg-gold text-parchment',
  Investimento: 'bg-midnight text-foam',
}

export default function PropertyCard({
  property,
  priority = false,
  className,
  variant = 'default',
}: PropertyCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      className={cn('group relative overflow-hidden bg-parchment', className)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/properties/${property.slug}`} className="block" aria-label={`Ver ${property.name}`}>
        {/* Image */}
        <div
          className={cn(
            'relative overflow-hidden bg-midnight/5',
            variant === 'featured' ? 'aspect-[4/3]' : variant === 'compact' ? 'aspect-[3/2]' : 'aspect-[16/9]'
          )}
        >
          <Image
            src={property.images[0]}
            alt={`${property.name} - ${property.island}`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              'object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
              hovered ? 'scale-105' : 'scale-100'
            )}
          />

          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-midnight/70 via-midnight/10 to-transparent transition-opacity duration-500',
              hovered ? 'opacity-100' : 'opacity-60'
            )}
          />

          {/* Badge */}
          {property.badge && (
            <div className="absolute top-4 left-4 z-10">
              <span className={cn('property-badge', badgeStyles[property.badge])}>
                {property.badge}
              </span>
            </div>
          )}

          {/* Quick stats overlay on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4 z-10 flex gap-4"
          >
            <StatPill label="Área" value={`${property.area}m²`} />
            <StatPill label="Quartos" value={String(property.bedrooms)} />
            <StatPill label="Ilha" value={property.island} />
          </motion.div>
        </div>

        {/* Card body */}
        <div className="p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-gold mb-1.5">
                {property.island} · {property.type}
              </p>
              <h3 className="font-cormorant text-xl font-medium text-midnight leading-tight">
                {property.name}
              </h3>
              <p className="font-dm text-sm text-midnight/50 mt-1 line-clamp-1">{property.view}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-[10px] tracking-widest text-midnight/30 uppercase">Preço</p>
              <p className="font-cormorant text-2xl font-semibold text-gold mt-0.5">
                {property.priceFormatted}
              </p>
            </div>
          </div>

          {variant !== 'compact' && (
            <div className="mt-4 pt-4 border-t border-midnight/8 flex items-center gap-5 text-midnight/50">
              <span className="font-mono text-[10px] tracking-wide">{property.bedrooms} Quartos</span>
              <span className="w-px h-3 bg-midnight/15" />
              <span className="font-mono text-[10px] tracking-wide">{property.bathrooms} WC</span>
              <span className="w-px h-3 bg-midnight/15" />
              <span className="font-mono text-[10px] tracking-wide">{property.area} m²</span>
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-midnight/60 backdrop-blur-sm px-2.5 py-1.5 rounded-sm">
      <p className="font-mono text-[8px] tracking-wider text-parchment/50 uppercase">{label}</p>
      <p className="font-mono text-[11px] text-parchment font-medium">{value}</p>
    </div>
  )
}
