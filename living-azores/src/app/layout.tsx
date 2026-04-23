import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/navigation/Navigation'
import Footer from '@/components/footer/Footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Living Azores with ERA',
    default: 'Living Azores with ERA — Imobiliário Premium no Faial e Pico',
  },
  description:
    'Propriedades de excepção nas ilhas do Faial e Pico, Açores. A agência imobiliária premium para compradores e investidores internacionais.',
  keywords: ['imobiliário açores', 'faial', 'pico', 'ERA', 'real estate azores', 'propriedades açores'],
  authors: [{ name: 'ERA Living Azores' }],
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: 'https://livingazores.pt',
    siteName: 'Living Azores with ERA',
    title: 'Living Azores with ERA — Imobiliário Premium nos Açores',
    description: 'Propriedades de excepção nas ilhas do Faial e Pico, Açores.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1589979481223-deb893043163?w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Living Azores with ERA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Living Azores with ERA',
    description: 'Imobiliário premium nos Açores.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Navigation />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
