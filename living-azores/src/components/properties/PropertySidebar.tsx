'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Property } from '@/data/properties'

interface PropertySidebarProps {
  property: Property
}

export default function PropertySidebar({ property }: PropertySidebarProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="lg:sticky lg:top-28">
      {/* Price card */}
      <div className="bg-midnight p-8 mb-4">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/30 mb-2">
          Preço de venda
        </p>
        <p className="font-cormorant text-4xl font-light text-gold mb-1">
          {property.priceFormatted}
        </p>
        <p className="font-mono text-[9px] text-parchment/30">Ref. {property.reference}</p>

        <div className="mt-6 pt-6 border-t border-parchment/10 grid grid-cols-3 gap-4">
          {[
            { label: 'Quartos', value: property.bedrooms },
            { label: 'WC', value: property.bathrooms },
            { label: 'Área', value: `${property.area}m²` },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-cormorant text-xl text-parchment">{s.value}</p>
              <p className="font-mono text-[8px] tracking-widest uppercase text-parchment/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="border border-midnight/12 p-8">
        <h2 className="font-cormorant text-2xl font-light text-midnight mb-1">
          Agendar uma Visita
        </h2>
        <p className="font-dm text-sm text-midnight/50 mb-6">
          Schedule a Visit — um consultor responderá em menos de 24 horas.
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <p className="font-cormorant text-3xl text-basalt mb-2">Obrigado!</p>
              <p className="font-dm text-sm text-midnight/60">
                Recebemos o seu pedido. Um consultor entrará em contacto brevemente.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-label="Formulário de visita"
            >
              <FormField
                label="Nome completo"
                name="name"
                type="text"
                placeholder="João Silva"
                required
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                placeholder="joao@exemplo.com"
                required
              />
              <FormField
                label="Telefone"
                name="phone"
                type="tel"
                placeholder="+351 912 345 678"
              />
              <div>
                <label className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/40 block mb-1.5">
                  Mensagem
                </label>
                <textarea
                  name="message"
                  rows={3}
                  defaultValue={`Tenho interesse em ${property.name}. Gostaria de agendar uma visita.`}
                  className="w-full border border-midnight/15 px-3 py-2.5 font-dm text-sm text-midnight bg-transparent focus:border-gold focus:outline-none resize-none placeholder:text-midnight/30"
                  aria-label="Mensagem"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin" />
                    A enviar...
                  </span>
                ) : (
                  'Agendar Visita'
                )}
              </button>

              <p className="font-mono text-[9px] text-midnight/30 text-center">
                Ou ligue directamente: +351 292 292 969
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Agent card */}
      <div className="mt-4 p-6 border border-midnight/8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-basalt/20 flex items-center justify-center shrink-0">
          <span className="font-cormorant text-lg text-basalt">RM</span>
        </div>
        <div>
          <p className="font-dm text-sm font-medium text-midnight">Rui Machado</p>
          <p className="font-mono text-[9px] tracking-wide uppercase text-midnight/40">
            Consultor ERA · Faial & Pico
          </p>
          <a href="tel:+351292292969" className="font-mono text-[9px] text-gold hover:text-gold-light transition-colors">
            +351 292 292 969
          </a>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  name,
  type,
  placeholder,
  required,
}: {
  label: string
  name: string
  type: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/40 block mb-1.5">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full border border-midnight/15 px-3 py-2.5 font-dm text-sm text-midnight bg-transparent focus:border-gold focus:outline-none placeholder:text-midnight/20"
      />
    </div>
  )
}
