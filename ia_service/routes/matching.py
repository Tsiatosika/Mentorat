# ia_service/routes/matching.py
from fastapi import APIRouter, HTTPException, status
from models import MatchRequest, MatchResponse, ScoreDetail, RecalculAllRequest, RecalculResponse
from matching.engine import obtenir_recommandations, recalculer_tous

router = APIRouter(prefix="/api/matching", tags=["Matching IA"])


@router.post(
    "/recommandations",
    response_model=MatchResponse,
    summary="Obtenir les recommandations de mentors pour un mentoré",
    description="""
    Retourne la liste des mentors classés par score de compatibilité.

    - Si des scores existent déjà en base et que `force_recalcul=False`,
      les résultats sont lus depuis le cache PostgreSQL (réponse rapide).
    - Si `force_recalcul=True` ou qu'aucun score n'existe,
      le moteur IA recalcule tous les scores avant de retourner les résultats.
    """
)
async def obtenir_recommandations_endpoint(body: MatchRequest):
    try:
        scores, depuis_cache = await obtenir_recommandations(
            mentore_id=body.mentore_id,
            force_recalcul=body.force_recalcul
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur moteur IA : {str(e)}"
        )

    recommandations = [
        ScoreDetail(
            mentor_id         = str(s["mentor_id"]),
            nom               = s.get("nom", ""),
            prenom            = s.get("prenom", ""),
            photo_url         = s.get("photo_url"),
            domaine           = s.get("domaine"),
            note_moyenne      = float(s.get("note_moyenne") or 0),
            nb_sessions       = int(s.get("nb_sessions") or 0),
            competences       = list(s.get("competences") or []),
            score             = float(s["score"]),
            score_competences = float(s["score_competences"]),
            score_dispo       = float(s["score_dispo"]),
            score_objectifs   = float(s["score_objectifs"]),
            score_reputation  = float(s["score_reputation"]),
            calcule_le        = s.get("calcule_le"),
        )
        for s in scores
    ]

    return MatchResponse(
        mentore_id       = body.mentore_id,
        total            = len(recommandations),
        recommandations  = recommandations,
        depuis_cache     = depuis_cache
    )


@router.post(
    "/recalculer",
    response_model=RecalculResponse,
    summary="Recalculer les scores pour un ou plusieurs mentorés",
    description="""
    Lance un recalcul complet des scores de matching.
    Si `mentore_ids` est vide, recalcule pour TOUS les mentorés.
    À appeler après une modification de profil mentor ou mentoré.
    """
)
async def recalculer_endpoint(body: RecalculAllRequest):
    try:
        traites = await recalculer_tous(body.mentore_ids)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur recalcul : {str(e)}"
        )
    return RecalculResponse(
        traites=traites,
        message=f"Scores recalculés pour {traites} mentoré(s)."
    )


@router.get(
    "/health",
    summary="Vérification de l'état du service",
)
async def health():
    return {"status": "ok", "service": "IA Matching — Mentorat Académique"}