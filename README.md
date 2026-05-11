# Gigflow - Web App

## Setup local

### 1. Installer les dépendances

```bash
cd dj-booking
npm install
```

### 2. Configurer Google OAuth

1. Va sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crée un projet (ou utilise un existant)
3. **APIs & Services > Credentials > Create Credentials > OAuth Client ID**
4. Type : **Web application**
5. Authorized redirect URIs : `http://localhost:3000/api/auth/callback/google`
6. Copie le Client ID et Client Secret

### 3. Configurer le .env

Modifie le fichier `.env` :

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="genere_avec_openssl_rand_base64_32"
GOOGLE_CLIENT_ID="ton-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="ton-client-secret"
```

Pour générer AUTH_SECRET :
```bash
openssl rand -base64 32
```

### 4. Initialiser la base de données

```bash
npx prisma migrate dev
```

### 5. Lancer l'app

```bash
npm run dev
```

Ouvre http://localhost:3000

## Fonctionnalités

- **Login Google** : authentification sécurisée
- **Dashboard** avec stats (dates à venir, fees total, contrats non signés, fees impayés)
- **Vue Table** : toutes les dates avec infos complètes
- **Vue Calendrier** : visualisation mensuelle
- **Formulaire** : ajout/édition avec tous les champs (date, heure, promoter, venue, ville, pays, cachet, contrat, fees, transport, hotel, notes, statut)
- **Filtres** : recherche texte + filtre par statut
- **Theme sombre** adapté

## Structure du projet

```
dj-booking/
├── prisma/
│   └── schema.prisma        # Modèles de données
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Auth Google
│   │   │   └── bookings/
│   │   │       ├── route.ts                  # GET/POST bookings
│   │   │       └── [id]/route.ts             # PUT/DELETE booking
│   │   ├── login/page.tsx    # Page de connexion
│   │   ├── layout.tsx        # Layout principal
│   │   └── page.tsx          # Page d'accueil (dashboard)
│   ├── components/
│   │   ├── Dashboard.tsx     # Dashboard principal
│   │   ├── BookingTable.tsx   # Vue table
│   │   ├── BookingForm.tsx    # Formulaire ajout/édition
│   │   ├── CalendarView.tsx   # Vue calendrier
│   │   └── types.ts          # Types TypeScript
│   └── lib/
│       ├── auth.ts           # Config NextAuth
│       └── prisma.ts         # Client Prisma
└── .env                      # Variables d'environnement
```

## Déploiement

### Vercel (recommandé, gratuit)

> Note : SQLite ne fonctionne pas sur Vercel (filesystem éphémère).
> Pour la prod, migre vers **Turso** (SQLite hébergé, gratuit) ou **PostgreSQL** (Supabase/Neon, gratuit).

#### Option Turso (SQLite cloud) :

1. Crée un compte sur [turso.tech](https://turso.tech)
2. `turso db create dj-booking`
3. `turso db tokens create dj-booking`
4. Mets à jour `.env` avec l'URL et le token Turso
5. Deploy sur Vercel : `npx vercel`

### VPS / Self-hosted

SQLite fonctionne directement sur un VPS. Il suffit de :

```bash
npm run build
npm start
```
