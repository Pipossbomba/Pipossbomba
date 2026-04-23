'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionReveal from '@/components/ui/SectionReveal'

const islands = ['Faial', 'Pico', 'Ambas', 'Ainda não definido']

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-midnight pt-36 pb-16">
        <div className="container-editorial">
          <SectionReveal>
            <span className="section-label text-parchment/40 mb-4 block">Contacto</span>
            <h1 className="section-title-light">
              Vamos conversar<br />
              <em className="font-light italic text-gold">sobre o seu próximo lar</em>
            </h1>
          </SectionReveal>
        </div>
      </div>

      {/* Split layout */}
      <section className="bg-parchment">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
          {/* Left: image */}
          <div className="relative min-h-[400px] lg:min-h-0">
            <Image
              src="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=900&q=85"
              alt="Porto da Horta, Faial"
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-midnight/20" />

            {/* Overlaid info */}
            <div className="absolute bottom-10 left-10 right-10">
              <div className="bg-midnight/80 backdrop-blur-sm p-6 space-y-4">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/30 mb-1">Escritório</p>
                  <address className="font-dm text-sm text-parchment/80 not-italic">
                    Av. 25 de Abril<br />
                    9900-114 Horta, Faial<br />
                    Açores, Portugal
                  </address>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="font-mono text-[9px] tracking-widest uppercase text-parchment/30 mb-1">Telefone</p>
                    <a href="tel:+351292292969" className="font-dm text-sm text-parchment hover:text-gold transition-colors">
                      +351 292 292 969
                    </a>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest uppercase text-parchment/30 mb-1">Email</p>
                    <a href="mailto:geral@livingazores.pt" className="font-dm text-sm text-parchment hover:text-gold transition-colors">
                      geral@livingazores.pt
                    </a>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-parchment/30 mb-1">Horário</p>
                  <p className="font-dm text-sm text-parchment/70">Seg–Sex: 09:00–18:00 · Sáb: 10:00–13:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex items-center justify-center p-8 lg:p-16 xl:p-20">
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mx-auto mb-6">
                      <span className="text-gold font-cormorant text-2xl">✓</span>
                    </div>
                    <h2 className="font-cormorant text-3xl text-midnight mb-3">Mensagem enviada</h2>
                    <p className="font-dm text-sm text-midnight/60 leading-relaxed">
                      Obrigado pelo seu contacto. A nossa equipa responderá
                      em menos de 24 horas úteis.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn-outline mt-8"
                    >
                      Enviar outra mensagem
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }}>
                    <h2 className="font-cormorant text-3xl font-light text-midnight mb-2">
                      Enviar Mensagem
                    </h2>
                    <p className="font-dm text-sm text-midnight/50 mb-8">
                      Preencha o formulário e um consultor especializado entrará em contacto.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Formulário de contacto">
                      <div className="grid grid-cols-2 gap-4">
                        <ContactField label="Nome" name="name" type="text" placeholder="João" required />
                        <ContactField label="Apelido" name="surname" type="text" placeholder="Silva" required />
                      </div>

                      <ContactField label="Email" name="email" type="email" placeholder="joao@exemplo.com" required />
                      <ContactField label="Telefone" name="phone" type="tel" placeholder="+351 912 345 678" />

                      <div>
                        <label htmlFor="island" className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/40 block mb-1.5">
                          Ilha de Interesse
                        </label>
                        <select
                          id="island"
                          name="island"
                          className="w-full border border-midnight/15 px-3 py-2.5 font-dm text-sm text-midnight bg-transparent focus:border-gold focus:outline-none appearance-none cursor-pointer"
                          defaultValue=""
                          aria-label="Ilha de interesse"
                        >
                          <option value="" disabled>Seleccione uma ilha...</option>
                          {islands.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="font-mono text-[9px] tracking-[0.15em] uppercase text-midnight/40 block mb-1.5">
                          Mensagem <span className="text-gold">*</span>
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          required
                          placeholder="Descreva o que procura — tipo de propriedade, localização preferida, orçamento, prazo de compra..."
                          className="w-full border border-midnight/15 px-3 py-2.5 font-dm text-sm text-midnight bg-transparent focus:border-gold focus:outline-none resize-none placeholder:text-midnight/20"
                        />
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="consent"
                          name="consent"
                          required
                          className="mt-0.5 accent-gold"
                        />
                        <label htmlFor="consent" className="font-dm text-xs text-midnight/50 leading-relaxed">
                          Consinto o tratamento dos meus dados pessoais pela ERA Living Azores para resposta
                          a este contacto, nos termos da{' '}
                          <a href="#" className="text-gold underline underline-offset-2">Política de Privacidade</a>.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border border-parchment/30 border-t-parchment rounded-full animate-spin" />
                            A enviar mensagem...
                          </span>
                        ) : (
                          'Enviar Mensagem'
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Additional info */}
      <section className="py-16 bg-midnight/3 border-t border-midnight/8">
        <div className="container-editorial">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '◈',
                title: 'Visitas Personalizadas',
                desc: 'Organizamos visitas às propriedades com transporte incluso, incluindo travessias inter-ilhas.',
              },
              {
                icon: '◎',
                title: 'Apoio Internacional',
                desc: 'Falamos PT, EN, ES e DE. Toda a documentação disponível nos idiomas dos nossos clientes.',
              },
              {
                icon: '↑',
                title: 'Processo Acompanhado',
                desc: 'Da pesquisa à escritura, coordenamos advogados, notários e serviços de mudanças.',
              },
            ].map((item) => (
              <SectionReveal key={item.title}>
                <div className="text-center p-6">
                  <p className="font-mono text-2xl text-gold mb-4">{item.icon}</p>
                  <h3 className="font-cormorant text-xl font-medium text-midnight mb-2">{item.title}</h3>
                  <p className="font-dm text-sm text-midnight/60 leading-relaxed">{item.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function ContactField({
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
