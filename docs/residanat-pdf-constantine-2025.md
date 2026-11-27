# Source importée : Résidanat Constantine, 25 octobre 2025

- PDF fourni par le propriétaire : https://www.ency-education.net/_files/ugd/414868_933464c1d6e341c69bd77a4b56c95fe4.pdf?index=true
- Titre : XLIXème concours d’accès au Résidanat de médecine.
- Institution dans le document : Université Salah Boubnider — Constantine 3,
  Faculté de médecine Pr B. Bensmail.
- Date de l’épreuve : 25/10/2025.
- 22 pages : énoncés 1–20, « Corrigé Type » 21–22.
- 150 questions, 750 propositions A–E, 150 clés de correction.
- SHA-256 du fichier : `0cf804dcaf8e492cee7b462ffa05b7ab91169be43391fbeb3dd8b62b7ef2bf13`.

## Transcription et provenance

Le PDF n’a pas de couche texte. Extraction OCR français, puis relecture contre
les images des pages pour restaurer notamment les lettres grecques, les unités,
les signes, les numéros de questions et les fins de ligne. Les numéros et les
pages sont conservés. Le classement en 27 spécialités est thématique (SB Cards),
pas un classement officiel ajouté par le document.

Les réponses correspondent à la grille imprimée : 1–100 page 21, 101–150 page 22.
Aucun raisonnement médical n’a été inventé pour justifier la grille, qui peut
elle-même contenir des coquilles. Par exemple, la kaliémie « 3,2 g/l » à la
question 64 est conservée telle qu’imprimée, avec une note explicite invitant à
vérifier l’unité dans le référentiel. Les textes et les clés ne constituent pas
une recommandation de prise en charge individuelle.

## Coexistence des deux années

Le document porte la clé `constantine-2025-10-25`, distincte de
`constantine-2026-10-17`. Le registre côté serveur valide l’unicité des identifiants
et des empreintes. Chaque import est transactionnel, réservé au propriétaire et
protégé par son propre reçu. Les énoncés, modifications, suppressions et tentatives
de l’année 2026 restent intacts. Une question ayant le même numéro dans les deux
années n’est pas considérée comme un doublon.

Les questions de 2025 sont ajoutées une seule fois lors du premier accès autorisé
à Résidanat après le déploiement. La liste « Document » et le bouton « Voir ces
questions » permettent de sélectionner l’année. Les clés non encore consultées
ne sont pas incluses dans la liste de pratique envoyée au navigateur.

Le fichier transcrit est `src/data/residanat/constantine-2025.json`, chargé par un
module `server-only`, pas un fichier servi sous `public/`. Le PDF source demeure
public sur son hébergeur ; dans SB Cards, le nouvel import n’est visible que dans
l’espace Résidanat privé. Les fichiers de travail PDF/OCR/images restent dans
`.artifacts/`, ignoré par Git.

## Tests locaux

Avec le serveur sur localhost et la base locale uniquement :

```bash
npm exec --yes --package=tsx -- tsx scripts/test-residanat-2025-import.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat-import.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat.ts
```

Le nouveau test compare les 150 énoncés, leurs 750 choix et les clés à ce qui est
réellement stocké, vérifie l’absence de doublons, l’isolation par année, le maintien
des données antérieures, les résultats et les refus d’accès. Il nettoie uniquement
ses propres sessions, tentatives et comptes temporaires.
