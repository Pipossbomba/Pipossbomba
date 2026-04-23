import Link from 'next/link'

const footerLinks = {
  propriedades: [
    { href: '/properties', label: 'Todas as Propriedades' },
    { href: '/properties?island=Faial', label: 'Faial' },
    { href: '/properties?island=Pico', label: 'Pico' },
    { href: '/properties?badge=Exclusivo', label: 'Exclusivos ERA' },
    { href: '/properties?badge=Investimento', label: 'Investimento' },
  ],
  empresa: [
    { href: '/about', label: 'Sobre a ERA Living Azores' },
    { href: '/blog', label: 'Editorial' },
    { href: '/contact', label: 'Contacto' },
    { href: '/about#team', label: 'Equipa' },
  ],
  legal: [
    { href: '#', label: 'Política de Privacidade' },
    { href: '#', label: 'Termos e Condições' },
    { href: '#', label: 'Política de Cookies' },
    { href: '#', label: 'Livro de Reclamações' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-midnight text-parchment/70" role="contentinfo">
      {/* Main footer */}
      <div className="container-editorial py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <span className="font-cormorant text-2xl font-light text-parchment tracking-wide block">
                Living Azores
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-parchment/40 mt-1 block">
                with ERA
              </span>
            </Link>
            <p className="font-dm text-sm leading-relaxed text-parchment/60 max-w-xs">
              Imobiliário premium nas ilhas do Faial e Pico, no coração do Atlântico.
              A sua janela para uma vida diferente.
            </p>
            <div className="mt-8 space-y-2">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-parchment/30">
                Escritório
              </p>
              <address className="font-dm text-sm text-parchment/60 not-italic leading-relaxed">
                Av. 25 de Abril<br />
                9900-114 Horta, Faial<br />
                Açores, Portugal
              </address>
              <a
                href="tel:+351292292969"
                className="font-dm text-sm text-parchment/80 hover:text-gold transition-colors block mt-3"
              >
                +351 292 292 969
              </a>
              <a
                href="mailto:geral@livingazores.pt"
                className="font-dm text-sm text-parchment/80 hover:text-gold transition-colors block"
              >
                geral@livingazores.pt
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment/30 mb-5">
                Propriedades
              </h3>
              <ul className="space-y-3">
                {footerLinks.propriedades.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-dm text-sm text-parchment/60 hover:text-parchment transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment/30 mb-5">
                Empresa
              </h3>
              <ul className="space-y-3">
                {footerLinks.empresa.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-dm text-sm text-parchment/60 hover:text-parchment transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment/30 mb-5">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-dm text-sm text-parchment/60 hover:text-parchment transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* ERA Badge */}
              <div className="mt-8 border border-parchment/10 p-4 inline-block">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-parchment/30">
                  Membro certificado
                </p>
                <p className="font-cormorant text-lg text-parchment/80 mt-1">ERA Portugal</p>
                <p className="font-mono text-[9px] text-parchment/30 mt-1">Lic. AMI 123456</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-parchment/8">
        <div className="container-editorial py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.1em] text-parchment/30">
            © {new Date().getFullYear()} Living Azores with ERA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.15em] text-parchment/30 hover:text-parchment/60 transition-colors uppercase"
              aria-label="Instagram"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.15em] text-parchment/30 hover:text-parchment/60 transition-colors uppercase"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.15em] text-parchment/30 hover:text-parchment/60 transition-colors uppercase"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
