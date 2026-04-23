export type BlogCategory = 'Mundo Imobiliário' | 'Viver nos Açores' | 'Investimento' | 'Compra e Venda'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: BlogCategory
  author: string
  authorRole: string
  publishedAt: string
  readTime: number
  featured: boolean
  image: string
  tags: string[]
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'mercado-imobiliario-acores-2025',
    title: 'O Mercado Imobiliário dos Açores em 2025: Oportunidade ou Bolha?',
    excerpt: 'Análise aprofundada das tendências de valorização nos últimos três anos e o que esperar dos próximos meses no mercado de Faial e Pico.',
    content: `O mercado imobiliário dos Açores viveu entre 2022 e 2025 uma transformação sem precedentes. Os preços médios de habitação no Faial subiram 23% em três anos — uma valorização robusta, mas sustentada por fundamentais sólidos, não por especulação.

A escassez de stock qualificado é o principal motor desta dinâmica. Nas ilhas do grupo central, o número de propriedades de qualidade disponíveis para venda mantém-se historicamente baixo: menos de 40 transações de imóveis acima de €250.000 por ano em todo o Faial.

Do lado da procura, o comprador estrangeiro consolidou a sua presença: americanos, canadianos e norte-europeus (principalmente alemães e holandeses) representam hoje mais de 45% das transações de valor elevado no arquipélago.

**O que sustenta esta valorização?**

Três vectores fundamentais: o regime fiscal do NHR (Non-Habitual Resident) — apesar das recentes alterações, ainda competitivo —; a requalificação das ligações aéreas com novos voos directos de Lisboa, Porto e destinos europeus; e a crescente visibilidade dos Açores como destino de luxo sustentável no contexto do travel aspiracional pós-pandemia.

**Perspectivas para 2025-2027**

A análise do pipeline de novos projetos residenciais nas ilhas indica uma oferta limitada — menos de 120 novas frações até 2027. Com a procura a manter-se firme, as condições para valorização continuada estão criadas.`,
    category: 'Mundo Imobiliário',
    author: 'Rui Machado',
    authorRole: 'Diretor ERA Living Azores',
    publishedAt: '2025-03-15',
    readTime: 8,
    featured: true,
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1400&q=85',
    tags: ['mercado', 'investimento', 'valorização', 'açores'],
  },
  {
    id: '2',
    slug: 'viver-no-faial-guia-expatriados',
    title: 'Viver no Faial: O Guia Definitivo para Expatriados',
    excerpt: 'Tudo o que precisa de saber para fazer a transição para a ilha das hortênsias — vistos, custos de vida, serviços e comunidade internacional.',
    content: `O Faial recebe anualmente mais de 800 novos residentes estrangeiros. Em 2024, a ilha ultrapassou pela primeira vez a marca de 3.000 não-nacionais registados nos serviços de estrangeiros e fronteiras. Um número pequeno em termos absolutos, mas extraordinário para uma ilha com 15.000 habitantes.

O que os atrai? A resposta é sempre multidimensional. A segurança — o Faial tem uma das taxas de criminalidade mais baixas da Europa —, a qualidade do ar e da água, o acesso a natureza intocada, e um custo de vida que, embora em alta, permanece 30-40% abaixo dos principais centros urbanos portugueses.

**Vistos e Residência**

Portugal mantém um conjunto alargado de opções para residência: o D7 (Visto de Rendas e Pensões), adequado a reformados e nómadas digitais com rendimento passivo; o Visto D8 (Nómada Digital); e para investidores, o Visto de Investimento em regime geral.

Os Açores beneficiam ainda de incentivos fiscais regionais — isenção de IRS e IRC durante os primeiros anos para residentes que transferem a base fiscal para o arquipélago.

**Custo de Vida**

Um casal pode viver confortavelmente no Faial com €2.500-3.500/mês, incluindo arrendamento de uma casa de qualidade. Para compradores, os custos fixos mensais de propriedade são substancialmente inferiores a qualquer capital europeia.`,
    category: 'Viver nos Açores',
    author: 'Catarina Sousa',
    authorRole: 'Consultora Imobiliária Sénior',
    publishedAt: '2025-02-28',
    readTime: 12,
    featured: false,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
    tags: ['expatriados', 'faial', 'residência', 'custo de vida'],
  },
  {
    id: '3',
    slug: 'investimento-alojamento-local-pico',
    title: 'Alojamento Local no Pico: O Investimento que os Números Justificam',
    excerpt: 'O enoturismo e o turismo de natureza transformaram o Pico numa das ilhas com maior retorno de alojamento local do arquipélago.',
    content: `O Pico passou de ilha de passagem a destino principal. Em 2024, registou 180.000 dormidas — um crescimento de 67% em cinco anos. A capacidade hoteleira instalada continua a ser insuficiente para absorver esta procura crescente.

O alojamento local de charme — casas de pedra restauradas, adegas convertidas, quintas agrícolas — preenche um nicho que os grandes hotéis não conseguem satisfazer: o turista premium que procura autenticidade, privacidade e integração na cultura local.

**Os Números do Negócio**

Uma propriedade de qualidade no Pico, com uma exploração profissional em alojamento local, atinge médias de ocupação de 75-85% em época alta (maio-setembro) e 40-50% em época baixa. A diária média para propriedades de charme ronda os €180-250.

Com uma propriedade como a Adega Convertida (€340.000), o potencial de receita bruta anual situa-se entre €60.000 e €80.000. Líquido de despesas operacionais e impostos, o rendimento anual líquido pode atingir €35.000-45.000 — uma yield de 10-13%.`,
    category: 'Investimento',
    author: 'Pedro Vieira',
    authorRole: 'Gestor de Investimentos ERA',
    publishedAt: '2025-02-10',
    readTime: 10,
    featured: false,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=85',
    tags: ['investimento', 'pico', 'alojamento local', 'yield'],
  },
  {
    id: '4',
    slug: 'guia-compra-imovel-acores-estrangeiros',
    title: 'Guia Prático: Comprar Imóvel nos Açores como Cidadão Estrangeiro',
    excerpt: 'O processo de aquisição passo a passo — da pesquisa ao registo, incluindo obrigações fiscais, documentação necessária e prazos realistas.',
    content: `Comprar imóvel nos Açores como estrangeiro é um processo relativamente simples comparado com outros países europeus. Portugal não impõe restrições à aquisição de imóveis por não-residentes — qualquer pessoa, de qualquer nacionalidade, pode comprar livremente.

**Fase 1: Preparação (4-8 semanas)**

O primeiro passo é obter o NIF (Número de Identificação Fiscal) português — indispensável para qualquer transação imobiliária. O processo pode ser feito presencialmente nas Finanças ou através de representante legal com procuração. Simultaneamente, abra uma conta bancária em Portugal — bancos como o Millennium BCP e o Novo Banco têm experiência com clientes não-residentes.

**Fase 2: A Proposta e o CPCV**

Uma vez identificado o imóvel desejado, a negociação culmina num Contrato de Promessa de Compra e Venda (CPCV), acompanhado de um sinal de 10-30% do valor acordado. Este contrato vincula ambas as partes — se o vendedor desistir, devolve o dobro do sinal; se o comprador desistir, perde o sinal.

**Fase 3: Due Diligence**

Neste período (tipicamente 30-60 dias), o advogado do comprador verifica: caderneta predial, certidão de teor do registo, licença de habitação, situação urbanística, e existência de ónus ou hipotecas. A ERA Living Azores coordena todo este processo.`,
    category: 'Compra e Venda',
    author: 'Rui Machado',
    authorRole: 'Diretor ERA Living Azores',
    publishedAt: '2025-01-20',
    readTime: 15,
    featured: false,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=85',
    tags: ['guia', 'compra', 'estrangeiros', 'processo'],
  },
  {
    id: '5',
    slug: 'arquitetura-vernacular-acoriana',
    title: 'A Arquitetura Vernacular Açoriana: Herança, Desafios e Oportunidades',
    excerpt: 'As casas tradicionais de pedra basáltica dos Açores tornaram-se objeto de desejo de compradores internacionais. Mas o que distingue autenticidade de imitação?',
    content: `A arquitetura vernacular açoriana é o resultado de séculos de adaptação ao território vulcânico e ao clima atlântico. Os seus elementos mais reconhecíveis — a pedra basáltica negra em aparelho regular, as janelas de correr em madeira pintada, os telhados de quatro águas em telha marselha — não são escolhas estéticas, mas respostas funcionais ao ambiente.

O basalto, pedra vulcânica de elevada durabilidade e baixa condutividade térmica, foi o material de construção privilegiado durante séculos. As suas propriedades naturais de isolamento — tanto térmico como acústico — tornam as habitações construídas neste material exceptcionalmente confortáveis.

**O Desafio da Autenticidade**

A popularidade crescente das propriedades tradicionais criou um mercado paralelo de "neo-vernacular" — construções novas que imitam superficialmente a estética tradicional sem respeitar a lógica construtiva original. Para o comprador informado, a distinção é crucial.

As casas autênticas revelam-se nos detalhes: a irregularidade controlada do aparelho de pedra (fruto do trabalho manual), a espessura das paredes (frequentemente 60-80 cm, impossível de replicar economicamente hoje), os interiores com soalhos de pinho manso ou eucalipto e tetos de cana.`,
    category: 'Viver nos Açores',
    author: 'Ana Bruges',
    authorRole: 'Especialista em Património',
    publishedAt: '2025-01-05',
    readTime: 9,
    featured: false,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=85',
    tags: ['arquitetura', 'vernacular', 'basalto', 'restauro'],
  },
  {
    id: '6',
    slug: 'golden-visa-nhr-acores-2025',
    title: 'NHR, Golden Visa e Incentivos Fiscais nos Açores em 2025',
    excerpt: 'O regime fiscal para novos residentes foi alterado, mas os Açores mantêm vantagens competitivas únicas. Um guia actualizado para 2025.',
    content: `As alterações ao regime NHR em 2024 criaram incerteza no mercado, mas a realidade é mais nuançada do que a narrativa mediática sugere. Os Açores, como região autónoma, mantêm um conjunto de benefícios fiscais regionais que preservam a atratividade do arquipélago para novos residentes.

**O Novo Regime IFICI**

O Incentivo Fiscal à Investigação Científica e Inovação (IFICI), que substituiu o NHR, aplica uma taxa especial de 20% sobre rendimentos profissionais a residentes que se qualifiquem como investigadores, profissionais altamente qualificados ou nómadas digitais. Embora mais restrito que o NHR original, mantém vantagens significativas para perfis específicos.

**Os Açores: Uma Vantagem Adicional**

A Região Autónoma dos Açores beneficia de autonomia fiscal que se traduz em deduções adicionais ao IRS (até 30% do imposto apurado) e taxas de IRC reduzidas para empresas sediadas no arquipélago. Para residentes, isto significa uma carga fiscal efectiva potencialmente inferior à de qualquer outra região portuguesa.`,
    category: 'Investimento',
    author: 'Pedro Vieira',
    authorRole: 'Gestor de Investimentos ERA',
    publishedAt: '2024-12-15',
    readTime: 11,
    featured: false,
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1400&q=85',
    tags: ['nhr', 'fiscal', 'incentivos', 'residência'],
  },
]

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getFeaturedPost(): BlogPost {
  return blogPosts.find((p) => p.featured) || blogPosts[0]
}

export function getLatestPosts(count = 3, excludeSlug?: string): BlogPost[] {
  return blogPosts.filter((p) => p.slug !== excludeSlug).slice(0, count)
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return blogPosts.filter((p) => p.category === category)
}
