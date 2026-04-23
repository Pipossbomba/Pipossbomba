'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { Property } from '@/data/properties'
import { cn } from '@/lib/utils'

interface PropertyGalleryProps {
  property: Property
}

export default function PropertyGallery({ property }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const prev = () => setActiveIndex((i) => (i - 1 + property.images.length) % property.images.length)
  const next = () => setActiveIndex((i) => (i + 1) % property.images.length)

  return (
    <>
      {/* Gallery grid */}
      <div className="pt-20 bg-midnight">
        <div
          className={cn(
            'grid gap-1',
            property.images.length >= 4
              ? 'grid-cols-4 grid-rows-2'
              : property.images.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2'
          )}
          style={{ height: '70vh', maxHeight: '700px' }}
        >
          {/* Main image — takes 2 columns, 2 rows */}
          <button
            onClick={() => openLightbox(0)}
            className="relative col-span-2 row-span-2 overflow-hidden group"
            aria-label={`Ver ${property.name} - imagem 1`}
          >
            <Image
              src={property.images[0]}
              alt={`${property.name} — vista principal`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-103"
            />
            <div className="absolute inset-0 bg-midnight/0 group-hover:bg-midnight/10 transition-colors duration-300" />
          </button>

          {/* Thumbnails */}
          {property.images.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i + 1)}
              className="relative overflow-hidden group"
              aria-label={`Ver ${property.name} - imagem ${i + 2}`}
            >
              <Image
                src={img}
                alt={`${property.name} — imagem ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-midnight/0 group-hover:bg-midnight/15 transition-colors duration-300" />
              {i === 3 && property.images.length > 5 && (
                <div className="absolute inset-0 bg-midnight/50 flex items-center justify-center">
                  <span className="font-cormorant text-parchment text-xl">
                    +{property.images.length - 5} fotos
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] lightbox-overlay bg-midnight/95 flex items-center justify-center"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Galeria de imagens"
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-parchment/50 hover:text-parchment font-mono text-sm tracking-widest z-10"
              aria-label="Fechar galeria"
            >
              ESC ×
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-6 text-parchment/50 hover:text-parchment font-cormorant text-4xl z-10 p-4"
              aria-label="Imagem anterior"
            >
              ←
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-6 text-parchment/50 hover:text-parchment font-cormorant text-4xl z-10 p-4"
              aria-label="Próxima imagem"
            >
              →
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full max-w-6xl max-h-[85vh] mx-16"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={property.images[activeIndex]}
                  alt={`${property.name} — imagem ${activeIndex + 1}`}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {property.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(i) }}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-200',
                    i === activeIndex ? 'bg-gold w-4' : 'bg-parchment/30'
                  )}
                  aria-label={`Ir para imagem ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
