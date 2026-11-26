# Source importée : Résidanat Constantine, 17 octobre 2026

## Document fourni par le propriétaire

- Source : https://www.ency-education.net/_files/ugd/414868_6e1fffbc5cb04e8f92dca104f1c70290.pdf?index=true
- Titre dans le scan : 50ème concours d’accès au Résidanat de médecine, 17 octobre 2026.
- En-tête du corrigé : Université Salah Boubnider — Constantine 3, Faculté de médecine.
- 21 pages : questions aux pages 1–19 ; « Corrigé Type » aux pages 20–21.
- 150 questions et 750 propositions A–E ; 150 clés de correction.
- SHA-256 du PDF téléchargé : `9e0414154bdb37845153557317f22df4d45ab9ac967d58d490e331284a495fb3`.

## Traitement et limites

Le PDF est constitué d’images, sans couche texte exploitable. Le texte a été
extrait par OCR français puis relu contre les pages scannées, avec restauration
des débuts de pages déformés. Les choix sont repérés A–E dans leur ordre
physique : plusieurs lettres sont mal imprimées ou répétées dans l’original.
Le premier item de la page 13 porte deux fois le numéro 96 ; l’item sur
l’ostéoporose est identifié comme 95 d’après la séquence et le tableau du corrigé.
Ces remarques sont conservées dans les corrigés concernés.

Les lettres des réponses sont celles du tableau fourni, pas des réponses
inventées ou corrigées médicalement par SB Cards. Le document peut contenir des
coquilles (notamment le signe ≥ de la proposition A à la question 84, conservé
avec la clé ACD du PDF). Il ne contient pas d’explications détaillées :
l’interface l’indique explicitement après validation. Le classement par
spécialité est un classement thématique SB Cards, non une section officielle du PDF.
Le lien « Voir l’énoncé » permet de comparer la transcription au scan original.
Ce contenu sert à la révision, pas à une décision médicale personnalisée.

## Stockage et confidentialité du site

Le jeu de données est dans `src/data/residanat/constantine-2026.json`, pas dans
`public/`. Il n’est chargé que par un module `server-only`. La liste de pratique
ne contient pas les clés de correction des questions non encore traitées.
Le document source est public chez son hébergeur ; dans SB Cards, ces QCM
restent dans l’espace privé du propriétaire et ne sont pas des publications
communautaires.

Au premier accès autorisé à Résidanat, le serveur insère 150 questions et un
reçu dans `residanat_document_imports` dans une transaction unique. La clé
composite `(user_id, document_key)` empêche la double importation, y compris lors
de requêtes simultanées. Un index unique sur l’origine de chaque question fournit
une protection supplémentaire. Les identifiants, pages et références sont stockés
avec les questions. Les anciennes questions et tentatives restent inchangées.

Une modification ou suppression manuelle ultérieure n’est pas annulée au
rechargement. L’encart distingue le nombre historiquement importé du nombre
encore disponible. Aucun téléchargement/OCR n’est nécessaire à l’exécution sur
Vercel : l’import utilise la transcription vérifiée livrée avec le code.

## Vérification locale

Le serveur doit tourner sur localhost avec une base locale et le compte
propriétaire existant. Aucun test ne doit écrire sur la base de production.

```bash
npm exec --yes --package=tsx -- tsx scripts/test-residanat-import.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat.ts
```

Le premier test compare tous les énoncés, les 750 propositions et les 150 clés
avec les valeurs réellement stockées ; il vérifie les doublons, les filtres, le
classement, la correction et les refus d’accès. Il ne supprime pas le document
importé ; il supprime uniquement ses sessions, son compte et ses tentatives de test.
Les fichiers PDF, images intermédiaires et sorties OCR de travail sont ignorés
par Git dans `.artifacts/`.
