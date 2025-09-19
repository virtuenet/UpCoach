# UpCoach – CMS Panel
**Centralized Content Management System for AI Coaching Platform**

---

## 📖 Overview
The CMS Panel powers all dynamic content on UpCoach’s landing page, microlearning library, avatar definitions, blog articles, and SEO configurations.

Built as a secure, role-gated admin portal with headless API integrations.

---

## 🧱 Tech Stack
| Layer          | Technology                        |
|----------------|-----------------------------------|
| Framework      | React (Vite) + shadcn/ui          |
| Auth           | Supabase Auth                     |
| Database       | Supabase Realtime                 |
| CMS Engine     | Custom Headless + Supabase Tables |
| Deployment     | Vercel                            |

---

## 📁 Folder Structure
```
src/
├── app/                   # Page routes
│   ├── dashboard/
│   ├── blog/
│   ├── library/
│   ├── seo/
│   └── avatars/
├── components/            # UI widgets (TableEditor, RichTextEditor)
├── lib/                   # Supabase client, auth, utils
├── constants/             # Role enums, app metadata
├── types/                 # Shared types
├── hooks/                 # Auth, fetch, useRoleGuard
├── styles/                # Tailwind setup
```

---

## 🧩 Key Functionalities

### 1. **Microlearning Library**
- Upload and categorize content (video, audio, articles)
- Set tags, access level, and narration options

### 2. **Blog & SEO**
- Write and publish articles (Rich Text)
- Manage SEO tags (meta title, keywords, image, Open Graph)

### 3. **Avatar & Coaching Persona**
- Define avatar profiles (name, tone, thumbnail, voice type)
- Sync to AI Coach system

### 4. **Home Page Content**
- Update marketing content blocks
- Control testimonials, feature descriptions, banners

### 5. **Role & Access Management**
- Only Admin and Editor roles can write
- View-only for Guests

---

## 🔐 Auth & Supabase Tables
- `cms_users`: auth table with role
- `library_items`, `blog_posts`, `seo_settings`, `home_blocks`, `avatars`

---

## ⚙️ Deployment Instructions
```bash
# Install deps
npm install

# Start local dev
npm run dev

# Deploy (for Vercel)
vercel
```

---

## 🛡️ Security & Backup
- All writes logged via Supabase audit log triggers
- RBAC enforced at UI and database policy level
- Daily table backup via Supabase scheduled jobs

---

## 🛠 Future Enhancements
- Live preview mode for blogs
- Version control of homepage content
- Image optimization for faster public site rendering
