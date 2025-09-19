# UpCoach – Admin Panel

## 🧠 Overview
The Admin Panel is a secure internal dashboard for managing:
- User profiles and subscription plans
- Coaching activity (plans, sessions, task progress)
- Escalation alerts and behavior risk flags
- Platform-wide analytics
- Admin role assignments and access control

Built for UpCoach staff and support teams to ensure personalized coaching oversight and safety.

---

## 🛠️ Tech Stack
| Layer              | Stack                         |
|--------------------|-------------------------------|
| Frontend           | React (Vite or Next.js)       |
| UI Framework       | shadcn/ui + Tailwind CSS      |
| Auth               | Supabase Auth + RBAC          |
| Backend API        | Supabase + Edge Functions     |
| Charts & Reports   | Chart.js / Recharts           |
| Deployment         | Supabase Hosting              |

---

## 📁 Folder Structure (example for Vite + shadcn/ui)
```
src/
├── app/                  # Page routing + layout
├── components/           # UI elements (Button, Sidebar, Table, etc)
├── features/             # Modular features
│   ├── users/            # User list, details, filters
│   ├── plans/            # Coaching plan insights
│   ├── flags/            # Escalation dashboard
│   ├── analytics/        # Charts, reports
│   └── roles/            # Role management
├── hooks/                # Supabase + data access
├── lib/                  # Utilities, constants
├── styles/               # Tailwind & globals
├── types/                # TypeScript types
└── index.tsx             # Entry
```

---

## 🔐 Role-Based Access Control (RBAC)
| Role               | Access Level                           |
|--------------------|----------------------------------------|
| **SuperAdmin**     | All users, plans, roles, analytics     |
| **CoachOps**       | Plans, task progress, escalation flags |
| **ContentManager** | CMS-facing: microlearning, SEO         |

RBAC logic is enforced via Supabase row-level security (RLS).

---

## 📊 Dashboard Widgets (Sample)
- 📈 Active User Growth
- 🧠 Plans Created (by cohort/role)
- 🚨 Escalation Flag Heatmap
- 📅 Coaching Sessions This Week
- ✅ Task Completion by Segment

---

## ⚙️ Dev Scripts
```bash
npm install
npm run dev         # start local
npm run build       # build prod
npm run lint        # check formatting
```

---

## 🔒 .env Example
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=public-key-here
```

---

## 📦 Deployment
- Preview: Vercel (staging admin)
- Production: Supabase hosting (or Vercel custom domain)

---

## 🔐 Security & Compliance
- Supabase RLS and policies enforced per role
- Sensitive logs encrypted
- GDPR-compliant: export + delete user data
- Token-expiry and refresh rules for all sessions

---

## 📚 Future Enhancements
- Audit logging system (user actions)
- Custom export builder (filters + CSV)
- Chat access logs / quality metrics
- Admin alert push (for flagged behavior)
