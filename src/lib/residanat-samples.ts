import type { QcmInput } from "@/lib/residanat-model";

const source = "Exercice pédagogique original SB Cards — non issu d’une annale officielle.";

export const RESIDANAT_SAMPLES: QcmInput[] = [
  {
    specialty: "Cardiologie",
    prompt: "Parmi les manifestations suivantes, lesquelles sont compatibles avec une insuffisance cardiaque gauche ?",
    options: [
      { id: "A", text: "Une dyspnée d’effort" },
      { id: "B", text: "Une orthopnée" },
      { id: "C", text: "Des crépitants pulmonaires bilatéraux" },
      { id: "D", text: "Une hématurie isolée, signe spécifique" },
      { id: "E", text: "Une douleur isolée de l’articulation du genou" },
    ],
    correctOptionIds: ["A", "B", "C"],
    explanation: "L’élévation des pressions de remplissage gauches peut provoquer une congestion pulmonaire, responsable de dyspnée, d’orthopnée et de crépitants. Ces signes orientent le diagnostic sans être tous spécifiques ni constamment présents. Une hématurie isolée ou une gonalgie n’est pas un signe caractéristique d’insuffisance cardiaque gauche.",
    source,
  },
  {
    specialty: "Gynécologie-obstétrique",
    prompt: "Quels éléments constituent la triade biologique du syndrome HELLP ?",
    options: [
      { id: "A", text: "Une hémolyse" },
      { id: "B", text: "Une élévation des enzymes hépatiques" },
      { id: "C", text: "Une thrombopénie" },
      { id: "D", text: "Une hypercalcémie" },
      { id: "E", text: "Une polyglobulie" },
    ],
    correctOptionIds: ["A", "B", "C"],
    explanation: "HELLP signifie Hemolysis, Elevated Liver enzymes, Low Platelets : hémolyse, cytolyse hépatique et baisse des plaquettes. Le contexte est habituellement obstétrical et nécessite une évaluation urgente. L’hypercalcémie et la polyglobulie ne font pas partie de cette triade.",
    source,
  },
  {
    specialty: "Pédiatrie",
    prompt: "Quel agent viral est classiquement le plus souvent impliqué dans la bronchiolite aiguë du nourrisson ?",
    options: [
      { id: "A", text: "Le virus respiratoire syncytial (VRS)" },
      { id: "B", text: "Le virus de l’hépatite B" },
      { id: "C", text: "Le virus de la rage" },
      { id: "D", text: "Le papillomavirus humain" },
    ],
    correctOptionIds: ["A"],
    explanation: "Le VRS est l’agent classiquement prédominant dans la bronchiolite aiguë du nourrisson. D’autres virus respiratoires peuvent aussi provoquer une bronchiolite ; il ne faut donc pas confondre agent le plus fréquent et agent exclusif.",
    source,
  },
  {
    specialty: "Hématologie",
    prompt: "En l’absence d’inflammation associée, quels résultats biologiques orientent vers une anémie par carence en fer ?",
    options: [
      { id: "A", text: "Un volume globulaire moyen abaissé" },
      { id: "B", text: "Une ferritine basse" },
      { id: "C", text: "Une saturation de la transferrine basse" },
      { id: "D", text: "Une ferritine très élevée, isolément" },
      { id: "E", text: "Une macrocytose constante" },
    ],
    correctOptionIds: ["A", "B", "C"],
    explanation: "Une carence martiale constituée peut entraîner une microcytose, une diminution de la ferritine et de la saturation de la transferrine. Au début, le volume globulaire moyen peut encore être normal. La ferritine doit être interprétée avec le contexte inflammatoire : elle peut augmenter au cours de l’inflammation.",
    source,
  },
  {
    specialty: "Endocrinologie",
    prompt: "Quels symptômes font partie du syndrome cardinal classique d’un diabète décompensé ?",
    options: [
      { id: "A", text: "Une polyurie" },
      { id: "B", text: "Une polydipsie" },
      { id: "C", text: "Un amaigrissement inexpliqué" },
      { id: "D", text: "Une douleur isolée de l’oreille" },
      { id: "E", text: "Une diplopie systématiquement présente" },
    ],
    correctOptionIds: ["A", "B", "C"],
    explanation: "L’hyperglycémie importante peut provoquer une diurèse osmotique avec polyurie et soif. Un déficit insulinique peut s’accompagner d’amaigrissement, parfois malgré une polyphagie. Le diagnostic repose sur des critères biologiques et ne doit pas être établi sur ces seuls symptômes.",
    source,
  },
  {
    specialty: "Infectiologie",
    prompt: "Quel examen permet classiquement de confirmer le paludisme en recherchant le parasite dans le sang ?",
    options: [
      { id: "A", text: "La goutte épaisse associée au frottis sanguin" },
      { id: "B", text: "La radiographie du genou" },
      { id: "C", text: "La mesure isolée de la natrémie" },
      { id: "D", text: "L’électrocardiogramme" },
    ],
    correctOptionIds: ["A"],
    explanation: "La goutte épaisse augmente la sensibilité de la recherche de parasites ; le frottis permet notamment l’identification de l’espèce et l’estimation de la parasitémie. Les tests rapides peuvent compléter la démarche selon les ressources. Une suspicion de paludisme impose une évaluation médicale rapide.",
    source,
  },
];
