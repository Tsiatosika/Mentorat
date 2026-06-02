# ia_service/main.py
import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager

from database import get_pool, close_pool
from routes.matching import router as matching_router
from config import settings

# ── Cycle de vie de l'application ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage : initialiser le pool PostgreSQL
    print("[IA Service] Connexion à PostgreSQL...")
    await get_pool()
    print("[IA Service] Prêt.")
    yield
    # Arrêt : fermer proprement le pool
    await close_pool()
    print("[IA Service] Connexion fermée.")

# ── Application FastAPI ───────────────────────────────────────────────────────

app = FastAPI(
    title="Microservice IA — Plateforme de Mentorat Académique",
    description="""
Microservice Python responsable du calcul du score de compatibilité
entre mentorés et mentors, basé sur un algorithme de **similarité cosinus multicritères**.

### Algorithme de scoring
| Composante       | Pondération | Méthode                         |
|------------------|-------------|----------------------------------|
| Compétences      | 40 %        | Similarité cosinus (scikit-learn)|
| Disponibilité    | 25 %        | Intersection des créneaux        |
| Objectifs        | 20 %        | Correspondance de domaine        |
| Réputation       | 15 %        | Note × facteur de confiance      |
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# ── Inclusion des routes ──────────────────────────────────────────────────────

app.include_router(matching_router)

# ── Lancement ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
        log_level="info"
    )