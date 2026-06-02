# ia_service/matching/scorer.py
"""
Calcul des 4 composantes du score de matching :
  - score_competences  (40%) : similarité cosinus entre vecteurs de compétences
  - score_dispo        (25%) : recoupement des disponibilités
  - score_objectifs    (20%) : alignement du domaine d'études
  - score_reputation   (15%) : note moyenne pondérée par le nombre de sessions
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from config import settings


def calculer_score_competences(
    vecteur_mentore: np.ndarray,
    vecteur_mentor:  np.ndarray
) -> float:
    """
    Similarité cosinus entre le vecteur d'objectifs_tags du mentoré
    et le vecteur de compétences du mentor.
    Retourne 0.0 si l'un des vecteurs est nul.
    """
    if vecteur_mentore.sum() == 0 or vecteur_mentor.sum() == 0:
        return 0.0
    v1 = vecteur_mentore.reshape(1, -1)
    v2 = vecteur_mentor.reshape(1, -1)
    score = float(cosine_similarity(v1, v2)[0][0])
    return round(max(0.0, min(1.0, score)), 4)


def calculer_score_disponibilite(
    creneaux_mentor:  list[str],
    creneaux_mentore: list[str] | None = None
) -> float:
    """
    Calcule le recoupement de disponibilités.
    - Si le mentoré a fourni ses préférences : intersection / union (Jaccard)
    - Sinon : score basé sur le nombre de créneaux du mentor (plus = mieux)
    """
    if not creneaux_mentor:
        return 0.0

    jours_mentor = set()
    for c in creneaux_mentor:
        try:
            jours_mentor.add(c.split(":")[0].lower().strip())
        except Exception:
            continue

    if creneaux_mentore:
        jours_mentore = set()
        for c in creneaux_mentore:
            try:
                jours_mentore.add(c.split(":")[0].lower().strip())
            except Exception:
                continue

        if not jours_mentore or not jours_mentor:
            return 0.0

        intersection = len(jours_mentor & jours_mentore)
        union = len(jours_mentor | jours_mentore)
        return round(intersection / union, 4) if union > 0 else 0.0
    else:
        # Pas de préférence mentoré → score proportionnel au nb de jours dispo
        score = min(len(jours_mentor) / 5.0, 1.0)
        return round(score, 4)


def calculer_score_objectifs(
    domaine_mentore: str | None,
    domaine_mentor:  str | None
) -> float:
    """
    Compare le domaine du mentoré et le domaine du mentor.
    - Identiques        → 1.0
    - Même catégorie    → 0.7  (ex: Informatique / Développement web)
    - Aucun lien        → 0.0

    Le regroupement en catégories est basé sur un référentiel simple.
    """
    if not domaine_mentore or not domaine_mentor:
        return 0.3  # valeur neutre si l'un des deux n'a pas renseigné son domaine

    d1 = domaine_mentore.lower().strip()
    d2 = domaine_mentor.lower().strip()

    if d1 == d2:
        return 1.0

    # Référentiel de catégories de domaines
    CATEGORIES = {
        "informatique": ["informatique", "développement web", "développement mobile",
                         "data science", "intelligence artificielle", "cybersécurité",
                         "réseaux", "systèmes embarqués", "génie logiciel"],
        "sciences":     ["mathématiques", "physique", "chimie", "biologie",
                         "statistiques", "sciences de l'ingénieur"],
        "gestion":      ["gestion", "management", "comptabilité", "finance",
                         "marketing", "ressources humaines"],
        "lettres":      ["lettres", "langues", "communication", "journalisme",
                         "philosophie", "histoire"],
    }

    def trouver_categorie(domaine: str) -> str | None:
        for cat, domaines in CATEGORIES.items():
            if any(domaine in d for d in domaines):
                return cat
        return None

    cat1 = trouver_categorie(d1)
    cat2 = trouver_categorie(d2)

    if cat1 and cat2 and cat1 == cat2:
        return 0.7

    return 0.0


def calculer_score_reputation(note: float, nb_sessions: int) -> float:
    """
    Score de réputation basé sur la note moyenne et le nombre de sessions.
    - note      : valeur entre 0 et 5
    - nb_sessions : poids de confiance (plus il y a de sessions, plus la note est fiable)

    Formule :
      score = (note / 5) × facteur_confiance
      facteur_confiance = min(nb_sessions / 10, 1.0)

    Un mentor avec note 5 mais 0 session → score 0.0 (pas encore évalué)
    Un mentor avec note 4 et 10+ sessions → score 0.80
    """
    if note <= 0 or nb_sessions <= 0:
        return 0.0

    note_normalisee    = note / 5.0
    facteur_confiance  = min(nb_sessions / 10.0, 1.0)
    score = note_normalisee * facteur_confiance

    return round(max(0.0, min(1.0, score)), 4)


def calculer_score_global(
    score_competences: float,
    score_dispo:       float,
    score_objectifs:   float,
    score_reputation:  float
) -> float:
    """
    Score global = somme pondérée des 4 composantes.
    Pondérations définies dans config.py :
      0.40 × compétences + 0.25 × dispo + 0.20 × objectifs + 0.15 × réputation
    """
    score = (
        settings.WEIGHT_COMPETENCES   * score_competences +
        settings.WEIGHT_DISPONIBILITE * score_dispo        +
        settings.WEIGHT_OBJECTIFS     * score_objectifs    +
        settings.WEIGHT_REPUTATION    * score_reputation
    )
    return round(max(0.0, min(1.0, score)), 4)