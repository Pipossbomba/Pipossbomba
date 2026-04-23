export type Island = 'Faial' | 'Pico'
export type PropertyType = 'Villa' | 'Quinta' | 'Casa' | 'Solar' | 'Adega'
export type PropertyBadge = 'Novo' | 'Exclusivo' | 'Investimento'

export interface Property {
  id: string
  slug: string
  name: string
  island: Island
  type: PropertyType
  price: number
  priceFormatted: string
  bedrooms: number
  bathrooms: number
  area: number
  view: string
  badge?: PropertyBadge
  description: string
  longDescription: string
  features: string[]
  images: string[]
  coordinates: { lat: number; lng: number }
  yearBuilt: number
  landArea?: number
  reference: string
}

export const properties: Property[] = [
  {
    id: '1',
    slug: 'quinta-da-caldeira',
    name: 'Quinta da Caldeira',
    island: 'Faial',
    type: 'Quinta',
    price: 485000,
    priceFormatted: '€485.000',
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    view: 'Vista oceano',
    badge: 'Exclusivo',
    description: 'Propriedade centenária com vista privilegiada sobre o Atlântico, jardins exuberantes e acabamentos de época restaurados com maestria.',
    longDescription: `A Quinta da Caldeira é uma propriedade excecional que combina o charme arquitetónico das tradicionais quintas faialenses com conforto contemporâneo. Situada numa das zonas mais exclusivas do Faial, com vista panorâmica sobre o oceano Atlântico e as ilhas do Grupo Central.

Com uma área de implantação de 320m², a propriedade distribui-se por dois pisos, com quatro suites luminosas, três casas de banho completas com acabamentos em pedra vulcânica, sala de estar de duplo pé-direito e cozinha de alta especificação totalmente equipada.

Os jardins, com mais de 2.000m², são um verdadeiro santuário de flora açoriana: hortênsias azuis, aucubas japónicas e fetos gigantes criam uma barreira natural de privacidade. Um terraço panorâmico com jacuzzi completa a proposta.`,
    features: [
      'Vista oceano panorâmica',
      'Jardim privado 2.000m²',
      'Terraço com jacuzzi',
      'Pedra vulcânica original',
      'Cozinha equipada de alto padrão',
      'Garagem dupla',
      'Sistema de painéis solares',
      'Lareira em pedra',
    ],
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=85',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1400&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=85',
    ],
    coordinates: { lat: 38.5375, lng: -28.6346 },
    yearBuilt: 1892,
    landArea: 2000,
    reference: 'ERA-FAI-001',
  },
  {
    id: '2',
    slug: 'casa-do-vulcao',
    name: 'Casa do Vulcão',
    island: 'Pico',
    type: 'Casa',
    price: 290000,
    priceFormatted: '€290.000',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    view: 'Vista vinha e vulcão',
    badge: 'Investimento',
    description: 'Casa contemporânea inserida nas vinhas classificadas do Pico, com vista direta para o vulcão e proximidade às adegas centenárias.',
    longDescription: `A Casa do Vulcão posiciona-se como uma das propostas mais apelativas do mercado imobiliário picoense. Construída em 2018 com materiais locais — pedra basáltica negra e madeira de criptoméria —, a casa integra-se harmoniosamente na paisagem vinhateira classificada pela UNESCO.

A arquitetura minimalista valoriza as vistas: do vulcão Pico, da vinha tradicional em currais e do horizonte atlântico. A planta aberta no piso térreo, com sala de estar, sala de jantar e cozinha integrados, maximiza a luminosidade e a fluidez espacial.

No piso superior, três quartos com roupeiros embutidos e duas casas de banho revestidas com lousas locais completam a proposta residencial.`,
    features: [
      'Arquitetura contemporânea em basalto',
      'Vista para o Vulcão do Pico',
      'Inserida em vinha UNESCO',
      'Adega privada',
      'Painéis solares e cisterna',
      'Varanda panorâmica',
      'Construção 2018',
      'Próximo da marina',
    ],
    images: [
      'https://images.unsplash.com/photo-1600047508788-786f3865b654?w=1400&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&q=85',
      'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=1400&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1400&q=85',
    ],
    coordinates: { lat: 38.4228, lng: -28.3269 },
    yearBuilt: 2018,
    landArea: 800,
    reference: 'ERA-PIC-001',
  },
  {
    id: '3',
    slug: 'villa-atlantica',
    name: 'Villa Atlântica',
    island: 'Faial',
    type: 'Villa',
    price: 780000,
    priceFormatted: '€780.000',
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    view: 'Vista oceano + piscina privada',
    badge: 'Exclusivo',
    description: 'O expoente máximo do luxo residencial no Faial. Piscina infinity sobre o Atlântico, cinco suites, spa privado e arquitetura galardoada.',
    longDescription: `A Villa Atlântica é, sem margem para dúvida, a propriedade mais premium do mercado açoriano. Projetada pelo atelier de arquitetura lisboeta Studio Atlas em 2020, a villa ganhou o prémio de "Melhor Residência Privada dos Açores" em 2022.

Com 450m² de área bruta e um lote de 3.500m², a propriedade oferece uma experiência residencial sem precedentes nas ilhas. A piscina infinity de 18 metros cria um efeito visual único de fusão com o horizonte atlântico. O spa privado com sauna finlandesa, sala de massagens e banho turco completa a proposta de bem-estar.

As cinco suites, todas com acesso a terraços privados, são assinadas pelo estúdio de design de interiores Phlippe Blanc & Associés, com obras de arte contemporânea portuguesa selecionadas especialmente para a villa.`,
    features: [
      'Piscina infinity 18m sobre o Atlântico',
      'Spa privado com sauna e banho turco',
      'Cinco suites com terraços privativos',
      'Design de interiores premium',
      'Domótica integrada',
      'Adega climatizada 200 garrafas',
      'Garagem para 4 viaturas',
      'Portaria 24h',
    ],
    images: [
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1400&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=85',
    ],
    coordinates: { lat: 38.5289, lng: -28.7021 },
    yearBuilt: 2020,
    landArea: 3500,
    reference: 'ERA-FAI-002',
  },
  {
    id: '4',
    slug: 'refugio-do-pico',
    name: 'Refúgio do Pico',
    island: 'Pico',
    type: 'Casa',
    price: 195000,
    priceFormatted: '€195.000',
    bedrooms: 2,
    bathrooms: 1,
    area: 120,
    view: 'Vista vulcão e montanha',
    badge: 'Novo',
    description: 'Casinha tradicional totalmente restaurada no interior do Pico, com autenticidade preservada, vistas para o vulcão e absoluta tranquilidade.',
    longDescription: `O Refúgio do Pico é uma proposta rara: autenticidade total, sem concessões. Esta casa de pedra basáltica, construída no século XIX, foi objeto de uma restauração cuidadosa que respeitou a arquitetura vernacular açoriana enquanto introduz conforto moderno onde necessário.

Com 120m² distribuídos por dois pisos, a casa oferece dois quartos espaçosos, uma casa de banho remodelada, cozinha totalmente equipada e uma sala de estar com lareira original em pedra. Um pátio privado de 400m² com vista direta para a silhueta majestosa do vulcão completa o conjunto.

Ideal para residência principal, casa de férias ou investimento em alojamento local de charme — categoria em forte expansão no Pico.`,
    features: [
      'Pedra basáltica original séc. XIX',
      'Vista direta para o vulcão',
      'Pátio privado 400m²',
      'Lareira original restaurada',
      'Completamente remodelada 2023',
      'Potencial alojamento local',
      'Ligação à rede de água e luz',
      'Internet fibra disponível',
    ],
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85',
      'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1400&q=85',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1400&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1400&q=85',
    ],
    coordinates: { lat: 38.4654, lng: -28.3891 },
    yearBuilt: 1890,
    landArea: 400,
    reference: 'ERA-PIC-002',
  },
  {
    id: '5',
    slug: 'solar-das-flores',
    name: 'Solar das Flores',
    island: 'Faial',
    type: 'Solar',
    price: 560000,
    priceFormatted: '€560.000',
    bedrooms: 4,
    bathrooms: 3,
    area: 380,
    view: 'Centro histórico + jardim privado',
    badge: 'Exclusivo',
    description: 'Solar pombalino em pleno centro histórico da Horta, classificado como imóvel de interesse público, com jardim murado e fachada original do século XVIII.',
    longDescription: `O Solar das Flores é um exemplar excecional da arquitetura civil açoriana setecentista. Situado no coração do centro histórico da Horta — classificado pela UNESCO como Paisagem de Interesse Cultural —, o solar ocupa um lote nobre com frente para o jardim Duque da Terceira.

A fachada de cantaria de basalto negro e branco, com janelas de peito e molduras trabalhadas, é um dos mais belos exemplos do barroco açoriano. O interior, alvo de intervenção respeitosa entre 2019 e 2021, equilibra elementos originais (soalhos em madeira de pinho, azulejos do século XIX, tectos em estuque decorado) com infraestruturas contemporâneas.

O jardim murado de 600m², com glicínias centenárias e um tanque de azulejos, é um oásis de privacidade no coração da cidade.`,
    features: [
      'Imóvel classificado séc. XVIII',
      'Centro histórico da Horta',
      'Jardim murado privado 600m²',
      'Soalhos e tectos originais',
      'Azulejos históricos',
      'Restauração 2021',
      'A 50m do porto de recreio',
      'Potencial turismo de habitação',
    ],
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1400&q=85',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=85',
      'https://images.unsplash.com/photo-1594484208280-efa00f96fc21?w=1400&q=85',
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1400&q=85',
    ],
    coordinates: { lat: 38.5348, lng: -28.6270 },
    yearBuilt: 1748,
    landArea: 600,
    reference: 'ERA-FAI-003',
  },
  {
    id: '6',
    slug: 'adega-convertida',
    name: 'Adega Convertida',
    island: 'Pico',
    type: 'Adega',
    price: 340000,
    priceFormatted: '€340.000',
    bedrooms: 3,
    bathrooms: 2,
    area: 220,
    view: 'Vista vinha e oceano',
    badge: 'Investimento',
    description: 'Conversão arquitetónica premiada: antiga adega de vinho do Pico transformada em residência de design, preservando a pedra basáltica e os arcos originais do século XIX.',
    longDescription: `A Adega Convertida é o resultado de uma das mais imaginativas reconversões arquitetónicas do arquipélago. Esta centenária adega de produção de vinho do Pico, com os seus característicos arcos de basalto negro, foi transformada pelo arquiteto João Mendes Ribeiro numa residência de design singular.

Os arcos originais em pedra dividem organicamente os espaços: sala de estar de pé-direito triplo com mezanino, cozinha-laboratório com ilha central, e três quartos integrados na estrutura histórica. A adega de vinho original, no sub-solo, foi transformada em espaço de convívio e adega privada.

A Adega Convertida integra o circuito de enoturismo do Pico, com potencial de exploração em alojamento de luxo — a zona é visitada por mais de 40.000 turistas por ano.`,
    features: [
      'Arcos de basalto séc. XIX originais',
      'Pé-direito triplo na sala',
      'Adega privada subterrânea',
      'Mezanino em aço corten',
      'Inserida em vinha UNESCO',
      'Potencial enoturismo',
      'Reconversão 2022 arquiteto premiado',
      'Vista oceano e vinha',
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1400&q=85',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=85',
      'https://images.unsplash.com/photo-1574691250077-03a929faece5?w=1400&q=85',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1400&q=85',
    ],
    coordinates: { lat: 38.4108, lng: -28.3562 },
    yearBuilt: 1875,
    landArea: 1200,
    reference: 'ERA-PIC-003',
  },
]

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug)
}

export function getRelatedProperties(currentSlug: string, count = 3): Property[] {
  return properties.filter((p) => p.slug !== currentSlug).slice(0, count)
}

export function getFeaturedProperties(count = 3): Property[] {
  return properties.filter((p) => p.badge === 'Exclusivo').slice(0, count)
}
