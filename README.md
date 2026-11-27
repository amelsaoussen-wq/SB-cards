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

---

## Résidanat — révisions privées du propriétaire

Ouvrir **Mon studio → Résidanat · privé** (ou `/dashboard/residanat`).
La banque propose recherche et classement par spécialité, création/édition/
suppression de QCM, réponses simples ou multiples, correction côté serveur,
explications et compteurs persistants. Une réponse exacte s’affiche en vert ;
une réponse incorrecte en rouge. Les requêtes répétées d’une même tentative ne
sont comptées qu’une fois. Les six exemples initiaux sont des exercices
pédagogiques originaux SB Cards, **pas des annales officielles importées**.

### Accès

- Le propriétaire déjà reconnu par le site conserve l’accès : la session doit
  correspondre à l’e-mail propriétaire de `src/lib/owner.ts` **et** au drapeau
  `is_admin` stocké dans PostgreSQL. Le nom de profil ou son rôle descriptif ne
  donnent aucun droit. Les autres administrateurs ne reçoivent pas automatiquement
  l’accès à cet espace personnel.
- `OWNER_USER_ID` est facultatif. S’il est défini, il remplace ce contrôle par une
  correspondance stricte avec l’UUID du compte dans la **base de production**.
  Un UUID invalide ou appartenant à une autre base ferme l’accès ; ne recopiez
  jamais l’UUID d’un bac à sable dans Neon. Après un changement de variable,
  effectuez un Redeploy.
- Les pages et **toutes** les routes `/api/residanat/**` vérifient l’accès côté
  serveur. Sans session : 401 ; autre compte : 403. Le lien est également masqué.
- Les QCM et leurs tentatives sont séparés des cartes et publications publiques.
  Aucune question privée n’est publiée dans Découvrir, les chaînes ou les abonnements.

Les trois tables `residanat_questions`, `residanat_attempts` et
`residanat_sample_imports` se créent de manière idempotente lors du premier accès
autorisé. Les exemples ne sont importés qu’une fois : une question supprimée ne
réapparaît pas au rechargement. Les données et mots de passe existants sont conservés.

### Tests locaux

Avec le serveur lancé sur localhost, les dépendances installées et `DATABASE_URL`
configuré, le script suivant vérifie création, correction, versions, persistance,
suppression, inscription et contrôle d’accès :

```bash
npm exec --yes --package=tsx -- tsx scripts/test-residanat.ts
```

Il utilise une session temporaire sur le compte propriétaire existant, sans
changer sa clé de connexion, et nettoie seulement ses propres données de test.
Le test navigateur `scripts/test-residanat-browser.ts` utilise Chromium via une
installation isolée de Playwright (`PLAYWRIGHT_MODULE` pointe vers son `index.mjs`).
Il vérifie également les formulaires réels et la disposition mobile. Les tests
n’écrivent jamais sur un domaine de production.

### PDF ajouté à la banque privée

Le document fourni par le propriétaire, **Résidanat de médecine — Constantine,
17 octobre 2026**, contient 150 questions et sa grille de correction. Les 150 QCM
sont importés automatiquement, une seule fois, au premier accès autorisé après
le déploiement. Les questions existantes ne sont pas remplacées. Un filtre
« Document », le numéro original et un lien vers chaque page permettent de les
retrouver. Les corrigés reprennent la grille du PDF sans inventer d’explications.
Voir [la provenance et les limites de transcription](docs/residanat-pdf-import.md).

Une seconde collection, **Constantine — 25 octobre 2025**, apporte 150 autres
questions et leur corrigé type (pages 21–22 du fichier). Elle est importée une
seule fois et reste distincte de 2026 : aucun énoncé, résultat ou changement
personnel de la première collection n’est écrasé. Utilisez le sélecteur
« Document » pour choisir l’année, puis filtrez par spécialité ou numéro.
Voir [la provenance de l’épreuve 2025](docs/residanat-pdf-constantine-2025.md).
Le test `scripts/test-residanat-2025-import.ts` vérifie toutes les questions et clés,
ainsi que la conservation des données antérieures ; le test navigateur
`scripts/test-residanat-2025-browser.ts` vérifie le changement d’année et le corrigé.

### Lot d’annales 2021–2023

Quatre autres documents sont ajoutés séparément : **27/03/2021 (120 QCM)**,
**19/02/2022 (120)**, **10/12/2022 (120)** et **28/10/2023 (150)**. Le lien répété
dans la demande est ignoré : le lot apporte **510 questions**, sans doublon ni
remplacement des collections 2025/2026. Les clés viennent des tableaux texte
« Corrigé Type » des fichiers ; les énoncés sont transcrits des scans avec leurs
références de page. Voir [la provenance et les limites du lot](docs/residanat-batch-2021-2023.md).

L’affichage est limité à **20 questions par page** pour garder une réponse légère
sur mobile et Vercel. Les filtres et la page courante sont conservés dans l’URL.
Le test `scripts/test-residanat-batch.ts` compare les 510 questions et 2 550 choix
stockés aux données et aux clés natives indépendantes ; le test navigateur
`scripts/test-residanat-batch-browser.ts` vérifie le changement de document, la
pagination, le rechargement et les corrections colorées.

Ne publiez jamais `.env` ni un jeton GitHub.
`scripts/check-github.mjs` lit `GITHUB_TOKEN` depuis les secrets du terminal ; il
ne publie rien et ne fait pas partie de l’application ou de ses bundles navigateur.


## Organisation des révisions par cours

L’entrée de Résidanat affiche désormais le parcours **Spécialité → Cours → QCM**.
Les cours et leurs compteurs proviennent des questions réellement enregistrées.
Le filtre de document limite les cours à l’annale choisie. Les références des PDF
restent disponibles dans « Documents d’origine », et « Toutes les questions »
permet toujours un entraînement libre paginé.

Le champ « Cours » de l’éditeur est modifiable. Le classement automatique est
thématique, pas une reproduction prétendue d’un programme universitaire. Son
remplissage initial et un déplacement de cours seul préservent le contenu des
questions et les corrections déjà enregistrées. Voir
[les détails du classement et des tests](docs/residanat-lessons.md).

Les quatre PDF demandés ont été identifiés et vérifiés par leur empreinte et par
les 510 clés des tableaux de correction ; le lien répété n’est pas importé deux
fois. Les collections 2025/2026 et les questions personnelles sont conservées.
