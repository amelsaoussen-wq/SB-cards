# SB Cards — Studio de cartes médicales

Générateur de cartes de raisonnement clinique : un diagnostic + six indices,
avec un design rose & or verrouillé, QR code et impression recto/verso.

- **Stack** : Next.js (App Router) · PostgreSQL · Drizzle ORM · Tailwind CSS.
- **Auth** : e-mail + mot de passe (scrypt), sessions en base de données.
- **Données** : cartes, indices, statistiques — persistantes.

---

## 🚀 Déploiement permanent (Vercel + Neon, gratuit)

### 1) Base de données — Neon
1. Créez un compte sur https://neon.tech
2. Créez un projet → copiez la **connection string** (elle commence par `postgresql://`).

### 2) GitHub
1. Créez un compte sur https://github.com
2. Nouveau dépôt (`New repository`) → nommez-le `sb-cards` → **Create**.
3. Téléversez tous les fichiers de ce projet (voir ci-dessous).

### 3) Vercel
1. Créez un compte sur https://vercel.com (avec GitHub).
2. **Add New → Project** → importez le dépôt `sb-cards`.
3. Dans **Environment Variables**, ajoutez :
   - `DATABASE_URL` = votre chaîne Neon.
4. **Deploy**.

Les tables et les données de démonstration se créent automatiquement au premier
accès. Aucune autre configuration n'est nécessaire.

---

## 💻 Exécution en local

```bash
npm install
# créez .env avec DATABASE_URL (voir .env.example)
npm run dev
```

Ouvrez http://localhost:3000 — compte démo : `demo@sb-cards.app` / `demo1234`.

---

## 📁 Téléverser vers GitHub

**Depuis un ordinateur (recommandé)** :
```bash
git init
git add .
git commit -m "SB Cards"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM/sb-cards.git
git push -u origin main
```

**Depuis le site GitHub** : dépôt → *Add file → Upload files* → glissez le
dossier du projet (sans `node_modules` ni `.next`).
