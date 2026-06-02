# ia_service/matching/vectorizer.py
"""
Transforme les profils bruts (depuis PostgreSQL) en vecteurs numériques
exploitables par l'algorithme de similarité cosinus.
"""
import numpy as np
from sklearn.preprocessing import normalize

# Jours de la semaine encodés en index (pour le calcul de disponibilité)
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def vectoriser_competences(competences: list[str], vocabulaire: list[str]) -> np.ndarray:
    """
    Crée un vecteur binaire de présence/absence pour chaque compétence.
    Exemple : ['Python', 'React'] sur vocabulaire de 5 items → [1, 0, 1, 0, 0]
    """
    if not vocabulaire:
        return np.zeros(1)
    vecteur = np.array([
        1.0 if comp.lower() in [c.lower() for c in competences] else 0.0
        for comp in vocabulaire
    ])
    return vecteur


def vectoriser_disponibilites(creneaux: list[str]) -> np.ndarray:
    """
    Encode les créneaux en vecteur de 7 dimensions (un par jour).
    Format des créneaux PostgreSQL : 'lundi:08:00:00-10:00:00'
    """
    vecteur = np.zeros(7)
    if not creneaux:
        return vecteur
    for creneau in creneaux:
        try:
            jour = creneau.split(":")[0].lower().strip()
            if jour in JOURS:
                idx = JOURS.index(jour)
                vecteur[idx] = 1.0
        except Exception:
            continue
    return vecteur


def construire_vocabulaire(tous_les_mentors: list[dict]) -> list[str]:
    """
    Construit le vocabulaire global des compétences à partir de tous les mentors.
    Retourne une liste triée et dédupliquée.
    """
    vocab = set()
    for mentor in tous_les_mentors:
        competences = mentor.get("competences") or []
        for c in competences:
            if c:
                vocab.add(c.strip().lower())
    return sorted(list(vocab))


def vectoriser_tags_mentore(tags: list[str], vocabulaire: list[str]) -> np.ndarray:
    """
    Transforme les objectifs_tags du mentoré en vecteur binaire
    aligné sur le même vocabulaire que les mentors.
    """
    if not tags:
        return np.zeros(len(vocabulaire) or 1)
    tags_norm = [t.lower().strip() for t in tags if t]
    return np.array([
        1.0 if comp.lower() in tags_norm else 0.0
        for comp in vocabulaire
    ])