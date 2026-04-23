import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="text-center px-6">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-parchment/30 mb-4">
          Página não encontrada
        </p>
        <h1 className="font-cormorant text-8xl lg:text-9xl font-light text-gold/20 mb-6">
          404
        </h1>
        <p className="font-cormorant text-2xl font-light text-parchment mb-8">
          Esta página perdeu-se no Atlântico.
        </p>
        <p className="font-dm text-sm text-parchment/40 mb-10 max-w-sm mx-auto">
          A página que procura pode ter sido removida, renomeada ou temporariamente indisponível.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Voltar ao Início
          </Link>
          <Link href="/properties" className="btn-ghost">
            Ver Propriedades
          </Link>
        </div>
      </div>
    </div>
  )
}
