# Parcours Résidanat : spécialité → cours → QCM

La page privée `/dashboard/residanat` s’ouvre désormais sur un catalogue de
spécialités. Cliquer sur une spécialité affiche ses cours, puis cliquer sur un
cours ouvre ses questions. Les fils de navigation permettent de revenir aux
cours ou aux spécialités. La sélection et la page sont conservées dans l’URL.

Le filtre « Document » limite le catalogue à une annale. La recherche peut
également ouvrir directement les résultats. L’accès à « Toutes les questions »
reste disponible et conserve la pagination de 20 questions. Les références PDF
sont regroupées sous « Documents d’origine » ; les énoncés et grilles ne changent pas.

## Source des quatre fichiers

Les quatre liens uniques fournis sont déjà enregistrés dans les collections
suivantes : mars 2021 (120), février 2022 (120), décembre 2022 (120), octobre 2023
(150), soit **510 QCM**. Le premier lien est répété dans la demande : aucune
nouvelle collection n’est créée pour cette occurrence. Les empreintes des quatre
PDF téléchargés ont été comparées aux jeux de données existants ; les 510 clés
ont aussi été comparées directement à la couche texte des tableaux « Corrigé Type ».
Les collections de 2025 et 2026 sont conservées.

## Classement éditorial, modifiable

`src/lib/residanat-course-map.ts` contient les intitulés de cours et un classement
thématique fondé sur la spécialité et l’énoncé, **jamais sur les réponses**. Il
s’agit d’une organisation SB Cards, pas d’un programme universitaire prétendument
fourni par les PDF. Les cas sans correspondance vont dans « Notions générales ».
Le propriétaire peut saisir un autre intitulé dans le champ « Cours » de l’éditeur.

Le champ `lesson` de `residanat_questions` est persistant. Les nouvelles questions
reçoivent un classement proposé si aucun cours n’est saisi. Le remplissage des
anciens champs vides est idempotent, limité au propriétaire et ne modifie aucun
énoncé, choix, corrigé, numéro de version, horodatage ni tentative. Il n’écrase pas
un cours déjà renseigné. Un ancien client qui ne transmet pas `lesson` ne remplace
pas un classement personnalisé lors d’une mise à jour.

Changer uniquement le cours utilise `PATCH /api/residanat/[id]` avec vérification
de version et du précédent cours. Cette opération conserve la correction affichée
et toutes les tentatives. Une modification du contenu clinique suit toujours le
flux `PUT` versionné existant. Tous les points d’entrée restent réservés au
propriétaire ; le catalogue n’est pas exposé dans la communauté.

## Vérification locale

Avec un serveur sur localhost et une base locale uniquement :

```bash
npm exec --yes --package=tsx -- tsx scripts/test-residanat-lessons.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat-batch.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat.ts
```

Le test navigateur `scripts/test-residanat-lessons-browser.ts` fonctionne avec
une installation isolée de Playwright (`PLAYWRIGHT_MODULE` = chemin absolu de son
`index.mjs`). Il vérifie le parcours, les compteurs, le filtre d’année, la création,
la conservation du corrigé après déplacement et l’affichage mobile/ordinateur.
Les données temporaires des tests sont nettoyées sans supprimer les annales.
