# UpCoach – Landing Page README

## 📌 Overview
This is the **public marketing website** for UpCoach, designed to:
- Showcase the value of the AI coaching mobile app
- Present app features and live demos
- Share user testimonials and FAQs
- Offer direct links to download the app (App Store + Play Store)

The landing page is optimized for SEO, responsive on all devices, and ready for future A/B testing and content updates via CMS or Markdown blocks.

---

## 🚀 Tech Stack
- **Framework**: Next.js 14 (or Astro.js alternative)
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel

Optional: Add CMS like Contentlayer or Sanity.io if frequent edits are needed.

---

## 🧱 Content Block Structure (Wireframe Guide)
```
LandingPage
├── HeroSection
│   └── Headline, tagline, app buttons, mockup animation
├── FeaturesSection
│   └── Grid of 3–6 features (AI Chat, Mood Tracker, etc.)
├── DemoSection
│   └── Embedded video or image carousel
├── TestimonialsSection
│   └── User quotes or reviews
├── HowItWorksSection
│   └── Step-by-step cards (onboarding → coaching → growth)
├── PricingSection
│   └── Free, Pro, Team tiers with CTA buttons
├── FAQSection
│   └── Accordion Q&A
├── Footer
│   └── App links, contact, privacy, social media
```

---

## 📁 Suggested Folder Structure
```
/landing
├── components/
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── DemoSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── PricingSection.tsx
│   ├── FAQSection.tsx
│   └── Footer.tsx
├── public/
│   ├── images/
│   └── videos/
├── styles/
│   └── globals.css
├── pages/
│   ├── index.tsx
│   ├── privacy.tsx
│   ├── terms.tsx
│   └── blog/
│       └── [slug].tsx
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## 🌐 SEO & Meta
- `/public/og-image.png`
- Open Graph tags (title, image, description)
- Meta description and keywords per section

---

## ⚙️ Setup Instructions
```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build static site
npm run build
```

---

## 🔐 Hosting
- Ideal: [Vercel](https://vercel.com/)

---

## 🧪 Testing
- Run accessibility checks via Lighthouse
- Mobile responsiveness audit
- SEO audit via Meta Tags tool

---

## 🛡️ Security & Privacy
- No user data collected directly on landing
- Track click-throughs only via anonymized tools (e.g., Plausible, Fathom)

---

## 📦 Future Enhancements
- Blog section (for SEO and authority)
- A/B testing framework (VWO, Optimizely)
- Dynamic FAQ or roadmap updates via Notion API or Markdown feed

---

## ➕ Additional Routes

### /privacy
Static page for the Privacy Policy. Styled consistently with the landing page. Supports markdown or CMS-managed content. Mobile-friendly layout with clear legal section anchors.

### /terms
Static Terms & Conditions page. Same style and structure as Privacy Policy. Content maintained via markdown or CMS.

### /blog
Optional blog index page powered by CMS (Supabase or markdown). Lists articles on AI coaching, productivity, mental wellness. Uses cards with thumbnails, tags, and preview.

### /blog/[slug]
Dynamic blog detail page. Loads article by slug, displays title, author, publish date, main body, and featured image. Includes Open Graph meta, social share icons, and estimated reading time.
