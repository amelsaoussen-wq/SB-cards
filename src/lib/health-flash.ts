/**
 * « ومضة صحية » : contenu court (5 s) affiché à l'entrée de l'app.
 * Base de connaissances médicale factuelle + jours mondiaux de santé.
 * Utilisée telle quelle, ou comme repli si aucune IA n'est configurée.
 */

export type HealthFlash = {
  id: string;
  tag: string;
  emoji: string;
  title: string;
  short: string;
  full: string;
};

type Item = Omit<HealthFlash, "id">;

const WORLD_DAYS: { month: number; day: number; item: Item }[] = [
  { month: 2, day: 4, item: { tag: "Journée mondiale", emoji: "🎗", title: "Journée mondiale contre le cancer", short: "Le 4 février, le monde se mobilise contre le cancer : dépistage précoce et prévention sauvent des vies.", full: "La Journée mondiale contre le cancer (4 février) sensibilise à la prévention, au dépistage précoce et à l'accès aux soins. Tabac, alcool, sédentarité et infections (HPV, hépatites) sont des facteurs évitables. Le dépistage (sein, col, côlon) et la vaccination HPV réduisent fortement la mortalité." } },
  { month: 3, day: 24, item: { tag: "Journée mondiale", emoji: "🫁", title: "Journée mondiale de lutte contre la tuberculose", short: "Le 24 mars rappelle que la tuberculose reste évitable et guérissable : toux > 2 semaines = consulter.", full: "La tuberculose se transmet par voie aérienne et reste une cause majeure de mortalité infectieuse. Une toux persistante (> 2 semaines), fièvre nocturne et amaigrissement doivent faire consulter. Le traitement antibiotique combiné (6 mois) guérit la majorité des cas ; le dépistage des contacts est essentiel." } },
  { month: 4, day: 7, item: { tag: "Journée mondiale", emoji: "🌍", title: "Journée mondiale de la santé", short: "Le 7 avril, l'OMS rappelle : la santé est un droit, pas un privilège. Accès aux soins pour tous.", full: "La Journée mondiale de la santé (7 avril, anniversaire de l'OMS) met en avant la couverture sanitaire universelle : soins primaires, vaccination, santé maternelle et infantile, et lutte contre les maladies non transmissibles." } },
  { month: 5, day: 31, item: { tag: "Journée mondiale", emoji: "🚭", title: "Journée mondiale sans tabac", short: "Le 31 mai : le tabac tue jusqu'à la moitié de ses consommateurs. Arrêter à tout âge apporte un bénéfice.", full: "Le tabagisme est le premier facteur de risque évitable de cancer, BPCO et maladies cardiovasculaires. L'arrêt du tabac, même tardif, réduit rapidement le risque cardiovasculaire. Substituts nicotiniques et accompagnement augmentent les chances de succès." } },
  { month: 6, day: 14, item: { tag: "Journée mondiale", emoji: "🩸", title: "Journée mondiale du donneur de sang", short: "Le 14 juin : un don de sang peut sauver jusqu'à 3 vies. Donneurs réguliers bienvenus.", full: "Le don de sang (tous les 8 semaines pour le sang total) est indispensable pour chirurgies, cancers, hémorragies obstétricales et drépanocytose. Un don dure ~45 min ; le volume prélevé est reconstitué en quelques jours." } },
  { month: 7, day: 28, item: { tag: "Journée mondiale", emoji: "🧬", title: "Journée mondiale contre l'hépatite", short: "Le 28 juillet : les hépatites B et C sont dépistables ; l'hépatite C se guérit aujourd'hui.", full: "Les hépatites virales B et C évoluent souvent silencieusement vers la cirrhose ou le cancer du foie. Le vaccin prévient l'hépatite B ; les antiviraux à action directe guérissent > 95 % des hépatites C en 8-12 semaines. Le dépistage est recommandé au moins une fois par vie adulte." } },
  { month: 9, day: 21, item: { tag: "Journée mondiale", emoji: "🧠", title: "Journée mondiale Alzheimer", short: "Le 21 septembre : perte de mémoire qui gêne le quotidien ≠ vieillissement normal. Consulter tôt.", full: "La maladie d'Alzheimer est la première cause de démence. Une perte de mémoire perturbant la vie quotidienne, des difficultés à planifier ou à s'orienter doivent alerter. Activité physique, contrôle tensionnel et lien social protègent le cerveau ; un diagnostic précoce permet d'organiser les soins." } },
  { month: 10, day: 10, item: { tag: "Journée mondiale", emoji: "💚", title: "Journée mondiale de la santé mentale", short: "Le 10 octobre : la santé mentale est une composante essentielle de la santé. En parler, c'est déjà se soigner.", full: "Dépression, anxiété et burn-out sont fréquents et traitables. Sommeil, activité physique, soutien social et psychothérapie aident ; les traitements médicamenteux si nécessaire. Demander de l'aide n'est pas un signe de faiblesse." } },
  { month: 11, day: 14, item: { tag: "Journée mondiale", emoji: "🩺", title: "Journée mondiale du diabète", short: "Le 14 novembre : soif intense, urines fréquentes, fatigue = penser au diabète et faire une glycémie.", full: "Le diabète de type 2 progresse silencieusement. Surpoids, sédentarité et antécédents familiaux augmentent le risque. Une glycémie à jeun ou HbA1c dépiste ; alimentation, activité et perte de poids peuvent prévenir ou retarder le type 2 ; le type 1 nécessite l'insuline." } },
  { month: 12, day: 1, item: { tag: "Journée mondiale", emoji: "🎗", title: "Journée mondiale de lutte contre le sida", short: "Le 1er décembre : le VIH se traite aujourd'hui ; une charge virale indétectable = non transmissible (I=I).", full: "Les antirétroviraux permettent une espérance de vie proche de la normale. Une personne sous traitement avec charge virale indétectable ne transmet pas le VIH (I=I). Le dépistage précoce et la PrEP protègent ; la stigmatisation reste un obstacle majeur." } },
];

const TIPS: Item[] = [
  { tag: "Info santé", emoji: "💧", title: "Hydratation : le réflexe simple", short: "Boire régulièrement de l'eau (≈1,5 L/j) soutient reins, cœur et concentration ; la soif est déjà un signal tardif.", full: "Les besoins hydriques varient (climat, effort, fièvre). Eau, tisanes et aliments riches en eau contribuent ; limiter sodas et alcool. Urines claires = bonne hydratation. Personnes âgées : la sensation de soif diminue, boire sans attendre." },
  { tag: "Info santé", emoji: "😴", title: "Sommeil : 7-9 h pour l'adulte", short: "Un sommeil régulier de 7-9 h protège cœur, immunité et mémoire ; écrans et caféine tardifs le perturbent.", full: "Le sommeil consolide la mémoire et régule hormones et immunité. Se coucher/lever à heures fixes, chambre sombre et fraîche, éviter écrans 1 h avant et caféine après 16 h. Ronflements avec pauses respiratoires = penser à l'apnée du sommeil." },
  { tag: "Info santé", emoji: "🧼", title: "Hygiène des mains", short: "Se laver les mains 20 s (ou gel hydroalcoolique) reste le geste le plus efficace contre les infections.", full: "Le lavage des mains réduit diarrhées et infections respiratoires. Moments clés : avant de manger/préparer, après toilettes, après transports, avant/après soins. Frotter paumes, dos, entre les doigts, pouces et ongles." },
  { tag: "Info santé", emoji: "🚶", title: "30 min de marche par jour", short: "30 min d'activité modérée/jour réduisent risque cardiovasculaire, diabète et dépression.", full: "L'OMS recommande 150-300 min/semaine d'activité modérée. Marche rapide, vélo, natation : fractionnable en séances de 10 min. Renforcement musculaire 2×/semaine. Même une petite augmentation apporte un bénéfice." },
  { tag: "Info santé", emoji: "🧂", title: "Sel : < 5 g par jour", short: "Réduire le sel (< 5 g/j) fait baisser la tension artérielle et protège cœur et reins.", full: "L'excès de sel (≈9-12 g/j en moyenne) favorise l'hypertension. Attention aux plats préparés, pain, charcuterie, fromages. Goûter avant de saler, utiliser herbes/épices/citron ; lire l'étiquette « sodium × 2,5 = sel »." },
  { tag: "Info santé", emoji: "💉", title: "Vaccins : protection collective", short: "La vaccination protège l'individu et la communauté ; les rappels (dTP, coqueluche, grippe) comptent.", full: "Les vaccins ont éradiqué la variole et fortement réduit rougeole, polio, diphtérie. Vérifier ses rappels (dTP tous les 20 ans chez l'adulte, coqueluche, grippe annuelle pour personnes à risque). La vaccination HPV prévient cancers du col et ORL." },
  { tag: "Info santé", emoji: "🦷", title: "Santé bucco-dentaire", short: "Brossage 2×/jour + fil dentaire : les caries et gingivites sont évitables, et liées au diabète/cœur.", full: "Se brosser les dents 2 min 2×/jour avec fluor, utiliser fil/brossettes, limiter sucre grignoté, consulter 1×/an. Les infections buccales aggravent diabète et risque cardiovasculaire ; une bouche saine aide à manger et parler." },
  { tag: "Info santé", emoji: "☀️", title: "Soleil : protection cutanée", short: "Écran solaire SPF 30+, ombre et vêtements : le bronzage est une lésion UV, pas un signe de santé.", full: "Les UV causent cancers cutanés et vieillissement. Appliquer SPF 30+ 30 min avant exposition, renouveler 2 h et après baignade ; éviter 12-16 h ; lunettes et chapeau. Surveiller grains de beauté (règle ABCDE) et consulter si changement." },
];

const UPDATES: Item[] = [
  { tag: "OMS / santé publique", emoji: "🌐", title: "Résistance aux antibiotiques", short: "L'OMS alerte : la résistance aux antibiotiques menace la médecine moderne ; n'utilisez les antibiotiques que sur prescription.", full: "Les bactéries résistantes rendent des infections courantes difficiles à traiter. Ne pas demander d'antibiotiques pour un rhume/virus, terminer le traitement prescrit, ne pas partager les restes, hygiène et vaccination préventives. L'usage agricole excessif accélère la résistance." },
  { tag: "OMS / santé publique", emoji: "🧂", title: "OMS : réduire les acides gras trans", short: "L'OMS vise l'élimination des acides gras trans industriels, responsables de maladies cardiovasculaires.", full: "Les trans industriels (huiles partiellement hydrogénées) augmentent le LDL et baissent le HDL. L'initiative REPLACE de l'OMS pousse à les éliminer des chaînes alimentaires ; lire « huiles partiellement hydrogénées » sur les étiquettes." },
  { tag: "Découverte / traitement", emoji: "🧬", title: "Thérapie génique : drépanocytose", short: "Une thérapie génique (édition CRISPR, Casgevy) a été approuvée contre la drépanocytose — une première.", full: "Casgevy (exagamglogene autotemcel), basée sur CRISPR-Cas9, réactive l'hémoglobine fœtale pour réduire les crises vaso-occlusives de la drépanocytose et de la bêta-thalassémie. Approuvée fin 2023 ; coût et accès restent des défis." },
  { tag: "Découverte / traitement", emoji: "💊", title: "GLP-1 : au-delà du diabète", short: "Les agonistes GLP-1 (sémaglutide) réduisent poids et risque cardiovasculaire chez certains patients.", full: "Initialement antidiabétiques, les agonistes du récepteur GLP-1 (sémaglutide, tirzépatide) induisent une perte de poids significative et réduisent événements cardiovasculaires chez sujets à risque. Effets indésirables digestifs ; prescription et suivi médicaux nécessaires." },
  { tag: "Découverte / traitement", emoji: "🧠", title: "Alzheimer : anticorps anti-amyloïde", short: "Des anticorps (lécanemab, donanemab) ralentissent le déclin dans l'Alzheimer débutant — effet modeste, surveillance requise.", full: "Ces immunothérapies ciblent l'amyloïde et ralentissent modestement le déclin cognitif à un stade précoce. Risque d'œdème/hémorragie cérébrale (ARIA) imposant IRM de surveillance ; sélection stricte des patients ; pas une guérison." },
  { tag: "Alerte / émergence", emoji: "🦟", title: "Maladies vectorielles en expansion", short: "Dengue, Zika, chikungunya : les moustiques Aedes étendent leur aire avec le climat ; protection anti-piqûres essentielle.", full: "Le réchauffement et l'urbanisation favorisent Aedes albopictus/aegypti. Répulsifs (DEET/icaridine), moustiquaires, suppression des eaux stagnantes ; vaccins dengue selon pays/antécédents. Consulter si fièvre + douleurs après séjour en zone endémique." },
  { tag: "Alerte / émergence", emoji: "🦠", title: "Grippe aviaire H5N1 : surveillance", short: "H5N1 circule chez oiseaux/mammifères ; risque humain faible mais surveillé — éviter contact animaux malades, lait cru.", full: "H5N1 hautement pathogène touche volailles et certains mammifères ; quelques cas humains liés à des contacts étroits. Pas de transmission interhumaine efficace à ce jour. Éviter oiseaux malades/morts et lait non pasteurisé ; cuisson suffisante des produits." },
  { tag: "Info santé", emoji: "🫀", title: "Tension artérielle : le tueur silencieux", short: "L'hypertension ne donne souvent aucun symptôme : la mesurer régulièrement est le seul moyen de la dépister.", full: "Objectif usuel < 140/90 mmHg (selon profil). Mesure au repos, bras soutenu, après 5 min assis. Sel, alcool, surpoids, sédentarité et stress contribuent ; traitement médicamenteux si nécessaire. Un contrôle régulier prévient AVC et insuffisance cardiaque/rénale." },
];

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Choisit une omflash : jour mondial du jour en priorité, sinon catégorie aléatoire. */
export function pickFlash(now = new Date(), rnd: () => number = Math.random): HealthFlash {
  const today = WORLD_DAYS.find(
    (w) => w.month === now.getMonth() + 1 && w.day === now.getDate(),
  );
  let item: Item;
  if (today && rnd() < 0.8) {
    item = today.item;
  } else {
    const pool = rnd() < 0.5 ? TIPS : UPDATES;
    item = pick(pool, rnd);
  }
  return { id: `${item.tag}-${item.title}`, ...item };
}

export const ALL_FLASH_ITEMS: Item[] = [
  ...WORLD_DAYS.map((w) => w.item),
  ...TIPS,
  ...UPDATES,
];
