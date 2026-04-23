# Living Azores with ERA

Premium real estate website for ERA Living Azores — a luxury real estate agency focused on the islands of Faial and Pico in the Azores, Portugal.

## Tech Stack

- **Next.js 14** (App Router, static generation)
- **TypeScript** — strict mode
- **Tailwind CSS** — custom design tokens
- **Framer Motion** — page transitions, scroll reveals, count-up animations
- **Google Fonts** — Cormorant Garamond, DM Sans, JetBrains Mono

## Design System

| Token | Value | Usage |
|---|---|---|
| `midnight` | `#0A0F1C` | Primary background, text |
| `parchment` | `#F5F0E8` | Light background, text on dark |
| `basalt` | `#2D4A3E` | Secondary accent, team section |
| `foam` | `#C8D8C0` | Subtle accent |
| `gold` | `#B8966E` | CTAs, highlights, stats |

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, why azores, featured properties, editorial |
| `/properties` | Properties listing with island/type/price filters |
| `/properties/[slug]` | Single property — gallery, details, contact form |
| `/about` | Agency manifesto, team, timeline, trust signals |
| `/blog` | Editorial magazine layout |
| `/blog/[slug]` | Single article |
| `/contact` | Split layout contact form |

## Setup

```bash
cd living-azores
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx           # Homepage
│   ├── about/
│   ├── blog/
│   ├── contact/
│   └── properties/
├── components/
│   ├── blog/              # BlogCard
│   ├── footer/            # Footer
│   ├── hero/              # Hero with video background
│   ├── navigation/        # Transparent → solid nav, mobile overlay
│   ├── properties/        # PropertyCard, PropertyFilter, Gallery, Sidebar
│   ├── sections/          # WhyAzores, FeaturedProperties, AtmosphericBreak, Editorial
│   └── ui/                # CountUp, PageTransition, SectionReveal
├── data/
│   ├── properties.ts      # 6 placeholder properties
│   └── blog.ts            # 6 editorial posts
└── lib/
    └── utils.ts
```

## Key Features

- **Transparent navigation** that transitions to solid with backdrop blur on scroll
- **Mobile full-screen overlay menu** with staggered animation
- **Hero** with video background placeholder (poster image shown by default), word-by-word text reveal
- **Property lightbox gallery** with keyboard-friendly navigation
- **Sticky property sidebar** with contact form
- **Count-up animation** on statistics when scrolled into view
- **Editorial blog layout** — featured article at full width, secondary articles in grid
- **Responsive** — tested at 375px, 768px, 1280px, 1920px
- **Accessible** — semantic HTML, ARIA labels, focus styles, skip-to-content
- **Performant** — static generation for all pages, Next.js Image optimization

## Adding Real Content

1. **Video**: Place `hero-video.mp4` in `/public/` — Hero component will use it automatically
2. **Properties**: Edit `src/data/properties.ts` — add real images, adjust prices and details
3. **Blog**: Edit `src/data/blog.ts` — replace placeholder content with real articles
4. **Images**: All placeholder images use Unsplash. Replace with professional photography
5. **Contact form**: Connect the form handlers to a backend (e.g., Resend, Formspree, custom API route)

## Environment Variables

No environment variables required for the base setup. If connecting a form service or CMS, create `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://livingazores.pt
RESEND_API_KEY=your_key_here
```

## Deployment

The project is optimized for deployment on **Vercel**:

```bash
vercel deploy
```

Or build and deploy to any Node.js host:

```bash
npm run build
# Deploy .next/ directory
```
