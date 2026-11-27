# Import des quatre annales demandées (2021–2023)

Le lien de mars 2021 figurait deux fois dans la demande, dont une occurrence
collée au lien précédent. Il est traité une seule fois. Aucun autre ancien
chantier fonctionnel n’est inclus dans cet import.

| Épreuve (Constantine) | Questions | Pages des énoncés | Pages du corrigé |
| --- | ---: | --- | --- |
| 27/03/2021 | 120 | 1–18 | 19 (1–80), 20 (81–120) |
| 19/02/2022 | 120 | 1–18 | 19 (1–80), 20 (81–120) |
| 10/12/2022 | 120 | 1–18 | 19 (1–80), 20 (81–120) |
| 28/10/2023 | 150 | 1–22 | 23 (1–100), 24 (101–150) |

Total : **510 questions et 2 550 propositions**, dans quatre collections distinctes.
L’institution est l’Université Salah Boubnider — Constantine 3, Faculté de
médecine Pr B. Bensmail, telle qu’indiquée sur les documents.

## Sources

- 2021 : https://www.ency-education.net/_files/ugd/414868_012773b560ac48bcb33ddc0621615375.pdf?index=true
- Février 2022 : https://www.ency-education.net/_files/ugd/414868_7498f45d3cc943829402d403cf84591e.pdf?index=true
- Décembre 2022 : https://www.ency-education.net/_files/ugd/414868_47d6fee55ee049ddba950bfedc0d0ca6.pdf?index=true
- 2023 : https://www.ency-education.net/_files/ugd/414868_5c722eda77614c91a5181f8ba2a1e39a.pdf?index=true

Chaque jeu JSON contient l’URL, l’empreinte SHA-256 du PDF téléchargé, la date,
le numéro et la page de chaque question, ainsi que les plages du corrigé.

## Extraction et limites

Les énoncés sont scannés, mais les tableaux « Corrigé Type » possèdent une couche
texte. Les **510 clés** ont été extraites de cette couche texte, sans déduction
médicale. Les énoncés ont fait l’objet d’une extraction OCR française. Les
numéros/options perdus dans les passages marqués, notamment dans l’épreuve de
2023, ont été repris à partir des images. La question 95 de février 2022 reprend
le contexte du cas de la question 94 afin de rester compréhensible seule.

Une transcription OCR peut encore contenir des erreurs typographiques. Le lien
vers la page du PDF reste disponible pour vérifier un terme, une unité ou une
formulation. Le classement en spécialités est thématique SB Cards. Les corrigés
sont ceux de documents anciens et peuvent comporter des coquilles ; ils ne
constituent pas des recommandations médicales actuelles ou personnalisées.
Aucune explication médicale n’a été inventée pour justifier les grilles.

## Intégration

- Import réservé au propriétaire, transactionnel et idempotent par document.
- Les groupes 2025/2026, leurs modifications et leurs tentatives restent inchangés.
- Pas de PDF/image de travail dans `public/`, pas de clés de correction dans les
  bundles JavaScript du navigateur. Les fichiers de travail sont ignorés par Git.
- Affichage de **20 questions par page**, pour éviter un rendu initial trop lourd
  après l’ajout des 510 questions. Filtre, document et page sont conservés dans
  l’URL lors d’un rechargement ; cela ne modifie pas le contenu des questions.

## Vérifications locales

```bash
npm exec --yes --package=tsx -- tsx scripts/test-residanat-batch.ts
npm exec --yes --package=tsx -- tsx scripts/test-residanat.ts
```

Le fixture `scripts/fixtures/residanat-batch-keys.json` provient des tableaux texte
natifs, indépendamment de la transcription des questions. Le test compare toutes
les propositions et clés stockées, vérifie les doubles requêtes, la conservation
des anciennes collections, les compteurs et l’accès privé. Les données temporaires
de test sont nettoyées, sans supprimer les collections importées.
