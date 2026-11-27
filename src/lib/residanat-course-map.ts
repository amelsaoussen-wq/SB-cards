type LessonRule = readonly [lesson: string, pattern: RegExp];

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/gi, "oe").replace(/æ/gi, "ae").replace(/[’‘]/g, "'").toLowerCase();
}

/** Editorial navigation labels, based only on the question stem, never on the answer key. */
const LESSONS: Record<string, LessonRule[]> = {
  "Anatomie pathologique": [
    ["Tumeurs et cancérogenèse", /tumeur|carcinome|cancer|metasta|dysplasie|bowen|neurofibrome|precancereux|melanome|sarcome|hemangiome|osteome|atypiques|mucosecretion|lymphome/],
    ["Lésions vasculaires et nécrose", /necrose|infarct|infarci|ischemi|embol|thromb|mediacalcose|congestion/],
    ["Inflammation et cicatrisation", /inflamm|granulome|tubercul|phlegmon|cicatri|fibrose|coaptation|macrophage|endothel|diapedese|sclerose|chimiotactisme|sarcoidose/],
    ["Dépôts et lésions cellulaires", /amylo|depot|steatose|atrophie|hypertrophie/],
  ],
  "Biochimie": [
    ["Métabolisme glucidique", /glycemi|glucagon|insulin|diabete|glucose|fructosamine|glyquee|peptide c|pyruvate kinase/],
    ["Métabolisme phosphocalcique", /calcem|calcium|phosphocal|vitamine d|parathorm|resorption osseuse|remodelage osseux|formation osseuse|osteogenese/],
    ["Lipides et lipoprotéines", /lipoprot|triglycer|cholesterol|lipide/],
    ["Explorations hormonales", /thyro|cortisol|cushing|addison|aldoster|croissance|prolactine|\bfsh\b|\blh\b|menstruel|hypophy|desmopressine|metopirone|acth|\bgh\b|somatomedine|igf|glucocorticoide/],
    ["Bilan hépatique", /cytolyse|hepat|cholestase|steatose|bilirubine|cirrhose|alcool/],
    ["Fonction rénale et équilibre acido-basique", /creatin|renal|urinaire|acidose|alcalose|bicarbonate|acido.basique|cockcroft|gault|nephrotique|natr|osmolar/],
    ["Protéines plasmatiques et inflammation", /proteine|electrophorese|inflamm|immunoglobuline/],
    ["Nutrition et absorption", /malabsorption|vitamine|\bfer\b|cholecystokinine/],
  ],
  "Physiologie": [
    ["Physiologie respiratoire", /respirat|surfactant|ventilat|alveol|\bvems\b|capnie|pulmonaire|spirometr|obstruction bronchique|hemoglobine|voies aeriennes/],
    ["Physiologie cardiovasculaire", /cardiaq|cardio|coronair|veineux|baroreflexe|renine|myocard|sinusal|inotrope|pression arterielle|purkinje|faisceau de his|ejection systolique|precharge|systole|diastole|vasculaire/],
    ["Physiologie rénale", /glomerul|tubul|reabsorption|renal|rein|urinaire|urine/],
    ["Physiologie endocrinienne", /hypophy|cortisol|testosterone|thyro|parathorm|folliculaire|hormone|endocrin|pituitaire|gnrh|incretine|sertoli|spermatogen/],
    ["Physiologie digestive", /cholecyst|biliaire|digestion|\bfer\b|absorption|estomac|aliments|pancrea/],
    ["Signalisation cellulaire", /paracrine|communication|membrane|signalisation/],
  ],
  "Biologie moléculaire": [
    ["Expression génétique et synthèse protéique", /arn|traduction|code genetique|ribos|transcription|nucleotide|nucleoside|cellules musculaires/],
    ["Génétique et organisation de l’ADN", /adn|gene|allele|chromos|interphase|mitose|acides nucleiques|heterochromatine|telomere|genome/],
  ],
  "Cardiologie": [
    ["Endocardites et péricardites", /endocardite|pericardite|frottement|epanchement pericardique/],
    ["Troubles du rythme et de la conduction", /fibrillation|tachycardie|bradycardie|auriculo.ventriculaire|\bbav\b|intervalle pr|trouble.*rythme|conduction|cha2ds/],
    ["Valvulopathies", /valvul|aortique|mitral|austin flint|tricuspide/],
    ["Syndromes coronariens", /infarctus|coronar|troponine|angineuses|angor|ischem|\bidm\b|reperfusion/],
    ["Insuffisance cardiaque", /insuffisance cardiaque|congestion|oedeme aigu/],
    ["Hypertension artérielle", /hypertension|\bhta\b|\bmapa\b/],
    ["Cardiopathies congénitales", /congenital|fallot|interauriculaire|interventriculaire/],
  ],
  "Pneumologie": [
    ["Asthme", /asthme|asthmat/],
    ["Tuberculose pulmonaire", /tubercul/],
    ["Pneumothorax", /pneumothorax/],
    ["Pleurésies", /pleuresie|pleural|epanchement/],
    ["Embolie pulmonaire", /embolie pulmonaire/],
    ["BPCO", /bpco|bronchite chronique/],
    ["Insuffisance respiratoire", /insuffisance respiratoire|gaz du sang|hypoxemie/],
    ["Sémiologie respiratoire", /douleur thoracique|dyspnee|hemoptysie|toux/],
  ],
  "Infectiologie": [
    ["Méningites", /meningite|meningee/],
    ["Sepsis et infections bactériennes", /staphyloco|\bsarm\b|\bsasm\b|bacteriemie|sepsis|septicemie/],
    ["Paludisme", /paludisme|plasmod/],
    ["Varicelle et zona", /zona|varicelle|\bvzv\b/],
    ["Tuberculose", /tubercul/],
    ["Infection à VIH", /\bvih\b|\bsida\b/],
    ["Antibiothérapie", /antibiot|resistance/],
  ],
  "Endocrinologie": [
    ["Diabète et complications", /diabete|diabetique|ceton|neuropathie|gastroparesie|insulin|hypoglycemie/],
    ["Pathologie thyroïdienne", /thyro|goitre/],
    ["Pathologie surrénalienne", /cushing|cortisol|addison|surrenale|aldoster/],
    ["Hyperandrogénie et troubles du cycle", /amenorrhee|hyperandrogenie|polykystique/],
    ["Pathologie hypophysaire", /acromegal|hypophy|prolactine/],
    ["Métabolisme phosphocalcique", /calcem|parathyro|phosphocal|sensible au calcium/],
  ],
  "Hépato-gastro-entérologie": [
    ["Cirrhose et complications", /cirrhose|cirrhotique|ascite|encephalopathie|hypertension portale/],
    ["Hépatites virales", /hepatite|hepatopathie.*virale|ag hbe/],
    ["Ulcère et Helicobacter pylori", /ulcere|pylori|gastroduoden/],
    ["Maladies inflammatoires intestinales", /crohn|rectocolite|\bmici\b/],
    ["Pathologie pancréatique", /pancreat/],
    ["Malabsorption", /malabsorption|coeliaque/],
  ],
  "Hématologie": [
    ["Anémies carentielles", /ferriprive|carence|microcytaire|carentielle/],
    ["Anémies hémolytiques et hémoglobinopathies", /hemol|thalassem|drepanocyt|hemoglobinopath/],
    ["Aplasies médullaires", /aplasie|pancytopenie/],
    ["Hémopathies malignes", /leucemie|lymphome|myelome|kahler|monoclonal/],
    ["Hémostase", /thrombopenie|coagulation|hemostase|plaquette|purpura|thrombopath|civd/],
  ],
  "Immunologie": [
    ["Système du complément", /complement|c1q|c3a|c3b/],
    ["CMH et présentation antigénique", /\bhla\b|\bcmh\b|microglobuline/],
    ["Immunité cellulaire", /cd4|lymphocyte|th1|nkp30|dendritique|mediation cellulaire|macrophage/],
    ["Hypersensibilité et auto-immunité", /auto.immun|hypersensibilite|allergie/],
    ["Immunoglobulines", /anticorps|immunoglob|\biga\b|\bigg\b|\bigm\b/],
  ],
  "Néphrologie": [
    ["Syndrome néphrotique", /nephrotique/],
    ["Insuffisance rénale chronique", /renale chronique|\birc\b/],
    ["Insuffisance rénale aiguë et épuration", /\bira\b|renale aigue|epuration|dialyse|hyperkaliemie/],
    ["Glomérulopathies", /glomerul|nephritique/],
    ["Lithiase urinaire", /lithiase|colique nephretique|calcul|cystinurie/],
  ],
  "Neurologie": [
    ["Maladie de Parkinson", /parkinson/],
    ["Syndromes médullaires et radiculaires", /moelle|medullaire|cordons|pyramidal|queue de cheval/],
    ["Neuropathies périphériques", /neurogene|enmg|neuropathie|polynevrite/],
    ["Myopathies", /myogene|myopathie/],
    ["Accidents vasculaires cérébraux", /\bavc\b|accident vasculaire/],
    ["Épilepsies", /epilep|crise convulsive/],
  ],
  "Neurochirurgie": [
    ["Traumatismes crâniens", /traumati|hematome|embarrure|rhinorrhee|glasgow|crane|cranio/],
    ["Pathologie rachidienne", /moelle|rachis|compression|pott/],
    ["Tumeurs intracrâniennes", /tumeur|intracranienne/],
  ],
  "Pédiatrie": [
    ["Rachitisme", /rachitisme/],
    ["Déshydratation aiguë", /deshydratation|diarrhee aigue/],
    ["Maladie cœliaque", /coeliaque/],
    ["Nutrition et croissance", /marasme|kwashiorkor|nutrition|poids|staturo.ponderal|gomez/],
    ["Diabète de l’enfant", /diabete|insulinotherapie|dt1/],
    ["Rhumatisme articulaire aigu", /rhumatisme articulaire|benzathine/],
    ["Méningites de l’enfant", /meningite|liquide clair.*lymphocytaire/],
    ["Pathologie respiratoire de l’enfant", /bronchiolite|asthme|respiratoire|toux rauque|dyspnee inspiratoire/],
    ["Néonatologie", /nouveau.ne|neonatal|ictere/],
    ["Vaccination", /vaccin/],
  ],
  "Psychiatrie": [
    ["Trouble obsessionnel compulsif", /obsession|compulsion|compulsif|\btoc\b/],
    ["Troubles bipolaires", /maniaque|bipolaire/],
    ["Stress post-traumatique", /stress post|\btspt\b/],
    ["Troubles anxieux", /anxieux|anxiete|panique|phobie/],
    ["Dépression", /depression|depressif|incurabilite/],
    ["Troubles psychotiques", /schizophrenie|psychose|psychotique|delirant/],
  ],
  "Dermatologie": [
    ["Psoriasis", /psoriasis/],
    ["Eczéma et dermatoses de contact", /eczema|dermatite|contact/],
    ["Syphilis et IST", /syphilis|tpha|vdrl|chancre|gonorrh|ecoulement uretral/],
    ["Dermatoses bulleuses", /bulleuse|pemphig/],
    ["Tumeurs cutanées", /melanome|cancer|carcinome/],
  ],
  "Rhumatologie": [
    ["Lombalgies et lombosciatiques", /lombosciatique|lombalgie|lasegue|disco.radiculaire|sciatique|hernie discale/],
    ["Polyarthrite rhumatoïde", /polyarthrite/],
    ["Ostéoporose et métabolisme osseux", /osteoporose|osteomalacie|hyperparathyroidie/],
    ["Spondyloarthrites", /spondylarth|spondyloarth/],
    ["Arthrose", /arthrose/],
    ["Arthropathies microcristallines", /goutte|chondrocalcinose/],
  ],
  "Santé publique": [
    ["Épidémiologie et méthodologie", /etude|cohorte|incidence|biais|cas.temoins|statistique|sensibilite|specificite/],
    ["Programmes de santé et prévention", /programme|vaccin|couverture|prevention|depistage/],
    ["Indicateurs de santé", /demographie|mortalite|morbidite/],
  ],
  "Médecine légale": [
    ["Constat et certificat de décès", /deces|mort|autopsie|cadaverique/],
    ["Coups et blessures", /coups|blessures|incapacite/],
    ["Responsabilité et déontologie", /responsabilite|secret medical|deontologie/],
    ["Certificats médicaux", /certificat/],
  ],
  "ORL": [
    ["Angines", /angine|amygdal/],
    ["Otites", /otite|tympan/],
    ["Vertiges", /vertige|vppb/],
    ["Surdités", /surdite|audition/],
    ["Pathologie nasosinusienne", /sinusite|nasal/],
  ],
  "Ophtalmologie": [
    ["Glaucome", /glaucome|pression intra.oculaire|pachymetrie/],
    ["Cataracte", /cataracte|cristallin/],
    ["Pathologie rétinienne", /retine|retinienne|decollement/],
    ["Pathologie de la surface oculaire", /conjonctiv|cornee/],
  ],
  "Traumatologie-orthopédie": [
    ["Fractures de la patella", /patella|rotule|appareil extenseur/],
    ["Fractures de l’extrémité supérieure du fémur", /col du femur|pertrochanter|pauwels|garden/],
    ["Luxations de la hanche", /tete femorale|luxation.*hanche/],
    ["Fractures du plateau tibial", /schatzker|plateau.*tibial/],
    ["Fractures de jambe et fractures ouvertes", /fracture.*jambe|gustilo|diaphysaire|cruro.pedieux/],
    ["Traumatismes de l’épaule", /clavicul|acromio|epaule|humerus|humera/],
    ["Tumeurs osseuses", /tumeur|osteome|osteosarcome|lytique|kyste osseux|vertebre en ivoire/],
    ["Pathologie du rachis", /rachis|pott|bohler|cervical|rachidien/],
    ["Infections ostéo-articulaires", /infection|osteomyelite|arthrite|tuberculose|proliferation bacterienne/],
  ],
  "Chirurgie digestive": [
    ["Appendicite et complications", /appendic/],
    ["Pancréatites", /pancreatite/],
    ["Cancer de l’estomac", /cancer.*estomac|linite|tumeur.*gastrique|cancer gastrique/],
    ["Cancers colorectaux", /cancer.*col|tumeur.*caecum|tumoral.*colon|adenocarcinome.*(?:colon|caecum)|rectum|lieberkuhnien/],
    ["Pathologie œsophagienne", /oesophage|oesophagien/],
    ["Hernies et éventrations", /hernie|eventration/],
    ["Traumatismes abdominaux", /traumati|contusion|\brate\b|hematome hepatique|\baast\b|bicyclette/],
    ["Urgences péritonéales", /peritonite|periton/],
    ["Occlusions intestinales", /occlusion|volvulus|ileus|koen|occlusif/],
    ["Chirurgie hépato-biliaire", /hydatique|gharbi|foie|cholecyst|angiocholite|biliaire|mirizzi|bouveret|hepatocellulaire|ictere cholestatique|ictere|vesiculaire|ecchinococcus|echinococcus/],
    ["Ulcère et hémorragies digestives", /ulcere|hemorragie digestive|gastroduoden/],
  ],
  "Gynécologie-obstétrique": [
    ["Grossesse extra-utérine", /grossesse extra|\bgeu\b/],
    ["HTA gravidique et pré-éclampsie", /eclampsie|hellp|hypertension.*grossesse|hta.*gravid/],
    ["Accouchement et hémorragie de la délivrance", /delivrance|accouchement|uterotonique|hemorragie|placenta/],
    ["Pathologie mammaire", /sein|mammaire|mammographie/],
    ["Cancer du col et dépistage", /cancer.*col|hpv|cervico|col.*uter/],
    ["Fibromes utérins", /myome|fibrome/],
    ["Pathologie ovarienne", /kyste ovarien|ovarien|ovaire/],
    ["Infections génitales", /infection|salpingite|genitale|genitaux|condylome/],
    ["Suivi de grossesse et pathologie fœtale", /gemellaire|grossesse|foetal|foetus|femme enceinte/],
  ],
  "Urologie": [
    ["Pathologie prostatique", /prostate|prostatique|adenomectomie|\bpsa\b|\bhbp\b/],
    ["Rétention d’urine et pathologie urétrale", /retention|uretrorragie|catheter|uretre/],
    ["Hématurie", /hematurie/],
    ["Lithiase urinaire", /lithiase|colique nephretique|calcul|cystinurie/],
    ["Tumeurs urothéliales", /cancer.*vessie|tumeur.*vessie/],
  ],
  "Anesthésie-réanimation": [
    ["Antibioprophylaxie", /antibioprophylax/],
    ["Infections du site opératoire", /infect/],
    ["Choc hémorragique", /choc|hemorragie/],
  ],
  "Chirurgie endocrinienne": [["Chirurgie thyroïdienne", /thyro/]],
  "Urgences": [
    ["Brûlures et accidents électriques", /brulure|electrique|electrisation/],
    ["États de choc et traumatologie", /choc|traumati|hemorragie/],
    ["Réanimation initiale", /arret cardiaque|reanimation/],
  ],
  "Gériatrie": [["Vieillissement et pathologies du sujet âgé", /age|vieillissement|demence|geriat/]],
  "Médecine interne": [["Maladies systémiques et auto-immunes", /lupus|auto.immun|systemique|vascularite/]],
};

const ADDITIONAL_LESSONS: Record<string, LessonRule[]> = {
  "Biochimie": [["Marqueurs cardiaques", /troponine|cpk|bnp/]],
  "Biologie moléculaire": [["Nucléotides et bioénergétique", /\batp\b/]],
  "Physiologie": [["Physiologie neuromusculaire", /muscle squelettique|fibres glycolytiques|neurotransmetteur|muscarinique|neuromediateur|neuromusculaire|synaptique/]],
  "Hématologie": [["Anémies centrales", /anemie|medullaire/]],
  "Hépato-gastro-entérologie": [["Ictères et bilirubine", /gilbert|ictere|bilirubine/]],
  "Infectiologie": [["Infections digestives", /cholera|diarrhee|salmonell/]],
  "Neurologie": [["Sémiologie neurologique", /semiologie/], ["Céphalées et douleurs faciales", /migraine|nevralgie|trijumeau|cephalee/]],
  "Pédiatrie": [["Tuberculose de l’enfant", /tuberculose/]],
  "Psychiatrie": [["Crises suicidaires", /suicide|suicidaire/], ["Psychopharmacologie", /benzodiazepine|neuroleptique|antidepresseur/]],
  "Médecine légale": [["Réquisitions médico-légales", /requisition/]],
  "ORL": [["Épistaxis", /epistaxis/], ["Adénopathies cervicales", /adenopathie/]],
  "Gynécologie-obstétrique": [["Pathologie de l’endomètre", /endometre/]],
  "Immunologie": [["Antigènes et réponse immunitaire", /ag t.dependant|antigene|epitope/]],
  "Médecine interne": [["Intoxications et métaux lourds", /saturn|plomb/], ["Pathologie hypophysaire", /sheehan|hypophyse/]],
  "Santé publique": [["Épidémies et mesures de santé publique", /covid|epidemie|pandemie/]],
  "Traumatologie-orthopédie": [["Traumatismes du genou", /genou|menisque/]],
};
const MORE_LESSONS: Record<string, LessonRule[]> = {
  "Endocrinologie": [["Cas cliniques et sémiologie", /pouls|jugulaires/]],
  "Immunologie": [["Récepteurs immunitaires", /recepteur/], ["Organes lymphoïdes et maturation", /centre germinatif/]],
  "Physiologie": [["Compartiments liquidiens et échanges", /secteur|compartiment/]],
  "Pédiatrie": [["Leishmaniose viscérale", /leishmaniose/]],
  "Neurologie": [["Syndrome cérébelleux", /cerebelleux/]],
  "Psychiatrie": [["Urgences psychiatriques", /agitation/], ["Sémiologie psychiatrique", /pensee|personnalite|rationalisme/]],
  "Hématologie": [["Splénomégalies", /splenomegalie/]],
  "Anesthésie-réanimation": [["Inflammation systémique et sepsis", /sirs|reponse inflammatoire/]],
  "Traumatologie-orthopédie": [["Lésions nerveuses traumatiques", /nerf/], ["Pathologie de la hanche", /coxalgie/], ["Sémiologie orthopédique", /signe/], ["Principes du traitement des fractures", /osteosynthese|fracture/]],
  "Chirurgie digestive": [["Urgences abdominales", /fosse iliaque|laparotomie|damage control|syndrome abdominal aigu/]],
  "Ophtalmologie": [["Trachome", /trachome/], ["Œil rouge et urgences oculaires", /oeil rouge/]],
  "Infectiologie": [["Microbiologie et virulence", /virulence/]],
  "Santé publique": [["Définitions épidémiologiques", /apparition inhabituelle/]],
};

function rulesFor(specialty: string): LessonRule[] {
  return [...(LESSONS[specialty] ?? []), ...(ADDITIONAL_LESSONS[specialty] ?? []), ...(MORE_LESSONS[specialty] ?? [])];
}

export const GENERAL_LESSON = "Notions générales";

export function inferResidanatLesson(specialty: string, prompt: string): string {
  const text = normalize(prompt);
  return rulesFor(specialty).find(([, pattern]) => pattern.test(text))?.[0] ?? GENERAL_LESSON;
}

export function suggestedLessons(specialty: string): string[] {
  return [...new Set([...rulesFor(specialty).map(([lesson]) => lesson), GENERAL_LESSON])]
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export function cleanLesson(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}
