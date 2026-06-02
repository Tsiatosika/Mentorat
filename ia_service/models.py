# ia_service/models.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ── Requête envoyée par le backend Node.js ────────────────────────────────────

class MatchRequest(BaseModel):
    mentore_id: str = Field(..., description="UUID du mentoré")
    force_recalcul: bool = Field(
        default=False,
        description="Si True, recalcule même si des scores existent déjà"
    )

# ── Réponse retournée au backend ──────────────────────────────────────────────

class ScoreDetail(BaseModel):
    mentor_id: str
    nom: str
    prenom: str
    photo_url: Optional[str] = None
    domaine: Optional[str] = None
    note_moyenne: float
    nb_sessions: int
    competences: list[str]
    score: float = Field(..., description="Score global [0..1]")
    score_competences: float
    score_dispo: float
    score_objectifs: float
    score_reputation: float
    calcule_le: Optional[datetime] = None

class MatchResponse(BaseModel):
    mentore_id: str
    total: int
    recommandations: list[ScoreDetail]
    depuis_cache: bool = False

# ── Requête de recalcul global (optionnelle) ──────────────────────────────────

class RecalculAllRequest(BaseModel):
    mentore_ids: Optional[list[str]] = Field(
        default=None,
        description="Liste d'UUIDs à recalculer. Si None, recalcule tout le monde."
    )

class RecalculResponse(BaseModel):
    traites: int
    message: str