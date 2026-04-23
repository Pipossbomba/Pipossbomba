'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const islands = ['Todos', 'Faial', 'Pico']
const types = ['Todos', 'Villa', 'Quinta', 'Casa', 'Solar', 'Adega']
const priceRanges = [
  { label: 'Todos os preços', min: 0, max: Infinity },
  { label: 'Até €300.000', min: 0, max: 300000 },
  { label: '€300.000 – €500.000', min: 300000, max: 500000 },
  { label: '€500.000 – €800.000', min: 500000, max: 800000 },
  { label: 'Acima de €800.000', min: 800000, max: Infinity },
]

export default function PropertyFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [island, setIsland] = useState(searchParams.get('island') || 'Todos')
  const [type, setType] = useState(searchParams.get('type') || 'Todos')
  const [priceKey, setPriceKey] = useState(searchParams.get('price') || 'Todos os preços')

  const applyFilters = (newIsland: string, newType: string, newPrice: string) => {
    const params = new URLSearchParams()
    if (newIsland !== 'Todos') params.set('island', newIsland)
    if (newType !== 'Todos') params.set('type', newType)
    if (newPrice !== 'Todos os preços') params.set('price', newPrice)
    startTransition(() => {
      router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  return (
    <div className={cn('border-b border-midnight/10 bg-parchment sticky top-20 z-30 transition-opacity', isPending && 'opacity-60')}>
      <div className="container-editorial py-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Island filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 mr-1">
              Ilha
            </span>
            {islands.map((i) => (
              <button
                key={i}
                onClick={() => {
                  setIsland(i)
                  applyFilters(i, type, priceKey)
                }}
                className={cn(
                  'font-dm text-xs px-3 py-1.5 border transition-all duration-200',
                  island === i
                    ? 'bg-midnight text-parchment border-midnight'
                    : 'border-midnight/20 text-midnight/60 hover:border-midnight/50 hover:text-midnight'
                )}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-midnight/15 hidden sm:block" />

          {/* Type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 mr-1">
              Tipo
            </span>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t)
                  applyFilters(island, t, priceKey)
                }}
                className={cn(
                  'font-dm text-xs px-3 py-1.5 border transition-all duration-200',
                  type === t
                    ? 'bg-midnight text-parchment border-midnight'
                    : 'border-midnight/20 text-midnight/60 hover:border-midnight/50 hover:text-midnight'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-midnight/15 hidden sm:block ml-auto" />

          {/* Price filter */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-midnight/30 shrink-0">
              Preço
            </span>
            <select
              value={priceKey}
              onChange={(e) => {
                setPriceKey(e.target.value)
                applyFilters(island, type, e.target.value)
              }}
              className="font-dm text-xs text-midnight bg-transparent border border-midnight/20 px-3 py-1.5 focus:border-gold focus:outline-none appearance-none cursor-pointer pr-6"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%230A0F1C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
            >
              {priceRanges.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
