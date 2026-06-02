# ia_service/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/mentorat_db"

    # Pondérations du score (doivent sommer à 1.0)
    WEIGHT_COMPETENCES:   float = 0.40
    WEIGHT_DISPONIBILITE: float = 0.25
    WEIGHT_OBJECTIFS:     float = 0.20
    WEIGHT_REPUTATION:    float = 0.15

    # Score minimum pour recommander un mentor
    SCORE_MIN: float = 0.10

    # Nombre maximum de recommandations retournées
    TOP_N: int = 10

    # Port du microservice
    PORT: int = 8001

    class Config:
        env_file = ".env"

settings = Settings()