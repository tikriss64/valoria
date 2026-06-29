# Valoria — AI Photo Valuation SaaS

<div align="center">

**🇬🇧 English · 🇫🇷 Français · 🇪🇸 Español**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-valoriahome.fr-brightgreen)](https://valoriahome.fr/)
[![OpenAI Vision](https://img.shields.io/badge/OpenAI-Vision-412991?logo=openai)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?logo=railway)](https://railway.app/)

</div>

---

## 🇬🇧 English

### Automatic object valuation from photos using AI vision

Valoria is a SaaS web application integrating generative AI for image analysis and automatic object valuation. Users upload photos of objects they want to sell; the AI analyzes them and delivers a complete actionable report by email.

**What the AI report includes:**
- Detailed description of each object
- Market value estimate with realistic price range
- Ready-to-copy sales listing text for online platforms (Wallapop, Milanuncios, Leboncoin, eBay...)
- Tips for presentation and photography
- Recommended sales channels (local market, online platforms, antique dealer, donation...)

**Platform features:**
- Multi-photo upload interface
- AI vision analysis (OpenAI GPT-4 Vision)
- Automated HTML email report delivery (Resend)
- Internal supervision dashboard — real-time monitoring of Railway, Supabase, OpenAI and Resend status
- QC Statistics dashboard — 30-day analysis volume, quality breakdown, language usage, plan types
- Multilingual — ES/FR/EN

**Architecture:**
- `frontend/` — React dashboard and QC interface (Lovable + TypeScript)
- `backend/` — Railway Node.js API handling AI analysis, database operations and email delivery

---

## 🇫🇷 Français

### Valorisation automatique d'objets par photos avec IA visuelle

Valoria est une application SaaS intégrant l'IA générative pour l'analyse d'images et la valorisation automatique d'objets. L'utilisateur envoie des photos ; l'IA analyse et livre un rapport HTML complet par e-mail.

**Le rapport inclut :** description détaillée, estimation de valeur avec fourchette de prix, texte d'annonce prêt à copier, conseils de mise en vente, canaux recommandés.

**Fonctionnalités :** upload multi-photos, analyse IA vision (OpenAI), envoi e-mail automatisé (Resend), dashboard de supervision temps réel, statistiques QC sur 30 jours. Multilingue ES/FR/EN.

---

## 🇪🇸 Español

### Valoración automática de objetos por fotos con IA visual

Valoria es una aplicación SaaS que integra IA generativa para el análisis de imágenes y la valoración automática de objetos. El usuario sube fotos; la IA analiza y entrega un informe HTML completo por email.

**El informe incluye:** descripción detallada, estimación de valor con rango de precios, texto de anuncio listo para copiar, consejos de venta, canales recomendados.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend / QC Dashboard | React + TypeScript + TailwindCSS |
| Backend API | Node.js on Railway |
| Database | Supabase (PostgreSQL) |
| AI Vision | OpenAI GPT-4 Vision |
| Email Delivery | Resend |
| Monitoring | Custom real-time dashboard |

## Structure

```
/
 backend/ Railway Node.js API
    server.js Main API server
    package.json
 frontend/ React QC Dashboard (Lovable)
     src/
        routes/ Dashboard, stats, supervision pages
        components/
     package.json
```

## Environment Variables

```bash
# Backend (Railway)
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
RESEND_API_KEY=your_resend_api_key

# Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Live Demo

**[https://valoriahome.fr/](https://valoriahome.fr/)**

## License

MIT
