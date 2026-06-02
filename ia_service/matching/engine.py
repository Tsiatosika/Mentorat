# ia_service/matching/engine.py
"""
Moteur principal de matching.
Orchestre la vectorisation, le scoring et la sauvegarde des résultats.
"""
from database import (
    fetch_mentore_profile,
    fetch_all_mentors,
    fetch_stored_scores,
    save_scores,
)
from matching.vectorizer import (
    construire_vocabulaire,
    vectoriser_competences,
    vectoriser_tags_mentore,
)
from matching.scorer import (
    calculer_score_competences,
    calculer_score_disponibilite,
    calculer_score_objectifs,
    calculer_score_reputation,
    calculer_score_global,
)
from config import settings


async def calculer_et_sauvegarder(mentore_id: str) -> list[dict]:
    """
    Calcule les scores de compatibilité entre un mentoré et tous les mentors
    disponibles, puis les sauvegarde dans matching_scores.
    Retourne la liste triée des scores calculés.
    """
    # 1. Charger le profil du mentoré
    mentore = await fetch_mentore_profile(mentore_id)
    if not mentore:
        raise ValueError(f"Mentoré introuvable : {mentore_id}")

    # 2. Charger tous les mentors disponibles
    mentors = await fetch_all_mentors()
    if not mentors:
        return []

    # 3. Construire le vocabulaire global des compétences
    vocabulaire = construire_vocabulaire(mentors)

    # 4. Vectoriser le mentoré
    tags_mentore = mentore.get("objectifs_tags") or []
    vecteur_mentore = vectoriser_tags_mentore(tags_mentore, vocabulaire)

    # 5. Calculer le score pour chaque mentor
    resultats = []
    for mentor in mentors:
        # Vecteur compétences du mentor
        competences_mentor = mentor.get("competences") or []
        vecteur_mentor = vectoriser_competences(competences_mentor, vocabulaire)

        # 4 composantes
        sc = calculer_score_competences(vecteur_mentore, vecteur_mentor)
        sd = calculer_score_disponibilite(mentor.get("creneaux") or [])
        so = calculer_score_objectifs(
            mentore.get("domaine"),
            mentor.get("domaine")
        )
        sr = calculer_score_reputation(
            float(mentor.get("note_moyenne") or 0),
            int(mentor.get("nb_sessions") or 0)
        )
        score_global = calculer_score_global(sc, sd, so, sr)

        # Filtrer les scores trop bas
        if score_global < settings.SCORE_MIN:
            continue

        resultats.append({
            "mentore_id":         mentore_id,
            "mentor_id":          str(mentor["id"]),
            "score":              score_global,
            "score_competences":  sc,
            "score_dispo":        sd,
            "score_objectifs":    so,
            "score_reputation":   sr,
        })

    # 6. Trier par score décroissant
    resultats.sort(key=lambda x: x["score"], reverse=True)

    # 7. Sauvegarder en base
    if resultats:
        await save_scores(resultats)

    return resultats[:settings.TOP_N]


async def obtenir_recommandations(
    mentore_id: str,
    force_recalcul: bool = False
) -> tuple[list[dict], bool]:
    """
    Retourne les recommandations pour un mentoré.
    - Si des scores existent et force_recalcul=False → lecture depuis le cache PostgreSQL
    - Sinon → recalcul complet
    Retourne (liste_scores, depuis_cache)
    """
    if not force_recalcul:
        scores_caches = await fetch_stored_scores(mentore_id, settings.TOP_N)
        if scores_caches:
            return scores_caches, True

    # Recalcul complet
    await calculer_et_sauvegarder(mentore_id)
    scores = await fetch_stored_scores(mentore_id, settings.TOP_N)
    return scores, False


async def recalculer_tous(mentore_ids: list[str] | None = None):
    """
    Recalcule les scores pour une liste de mentorés (ou tous si None).
    Utilisé pour la mise à jour périodique des scores.
    """
    from database import get_pool

    if mentore_ids is None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id FROM profils_mentore")
            mentore_ids = [str(r["id"]) for r in rows]

    traites = 0
    for mid in mentore_ids:
        try:
            await calculer_et_sauvegarder(mid)
            traites += 1
        except Exception as e:
            print(f"[WARN] Erreur pour mentoré {mid} : {e}")

    return traites