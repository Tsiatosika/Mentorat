# ia_service/database.py
import asyncpg
from config import settings

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=2, max_size=10)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

# ── Requêtes utilisées par le moteur ──────────────────────────────────────────

async def fetch_mentor_profile(mentor_id: str) -> dict | None:
    """Récupère le profil complet d'un mentor avec ses compétences et disponibilités."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                pm.id,
                pm.domaine,
                pm.note_moyenne,
                pm.nb_sessions,
                pm.disponible,
                pm.annees_experience,
                ARRAY_AGG(DISTINCT c.nom)       FILTER (WHERE c.nom IS NOT NULL)  AS competences,
                ARRAY_AGG(DISTINCT mc.niveau)   FILTER (WHERE mc.niveau IS NOT NULL) AS niveaux,
                ARRAY_AGG(
                    d.jour_semaine || ':' || d.heure_debut::text || '-' || d.heure_fin::text
                ) FILTER (WHERE d.id IS NOT NULL) AS creneaux
            FROM profils_mentor pm
            LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
            LEFT JOIN competences c         ON c.id = mc.competence_id
            LEFT JOIN disponibilites d      ON d.mentor_id = pm.id
            WHERE pm.id = $1 AND pm.disponible = TRUE
            GROUP BY pm.id
        """, mentor_id)
        return dict(row) if row else None


async def fetch_all_mentors() -> list[dict]:
    """Récupère tous les mentors disponibles avec leurs profils complets."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                pm.id,
                pm.domaine,
                pm.note_moyenne,
                pm.nb_sessions,
                pm.disponible,
                pm.annees_experience,
                ARRAY_AGG(DISTINCT c.nom)  FILTER (WHERE c.nom IS NOT NULL)  AS competences,
                ARRAY_AGG(
                    d.jour_semaine || ':' || d.heure_debut::text || '-' || d.heure_fin::text
                ) FILTER (WHERE d.id IS NOT NULL) AS creneaux
            FROM profils_mentor pm
            LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
            LEFT JOIN competences c         ON c.id = mc.competence_id
            LEFT JOIN disponibilites d      ON d.mentor_id = pm.id
            WHERE pm.disponible = TRUE
            GROUP BY pm.id
        """)
        return [dict(r) for r in rows]


async def fetch_mentore_profile(mentore_id: str) -> dict | None:
    """Récupère le profil du mentoré (objectifs_tags, domaine, etc.)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                pme.id,
                pme.domaine,
                pme.objectifs_tags,
                pme.niveau_etude,
                pme.progression
            FROM profils_mentore pme
            WHERE pme.id = $1
        """, mentore_id)
        return dict(row) if row else None


async def save_scores(scores: list[dict]):
    """Insère ou met à jour les scores dans matching_scores (upsert)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.executemany("""
            INSERT INTO matching_scores
                (mentore_id, mentor_id, score,
                 score_competences, score_dispo, score_objectifs, score_reputation,
                 algorithme, calcule_le)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'cosine_v1', NOW())
            ON CONFLICT (mentore_id, mentor_id)
            DO UPDATE SET
                score             = EXCLUDED.score,
                score_competences = EXCLUDED.score_competences,
                score_dispo       = EXCLUDED.score_dispo,
                score_objectifs   = EXCLUDED.score_objectifs,
                score_reputation  = EXCLUDED.score_reputation,
                algorithme        = EXCLUDED.algorithme,
                calcule_le        = NOW()
        """, [
            (
                s["mentore_id"], s["mentor_id"], s["score"],
                s["score_competences"], s["score_dispo"],
                s["score_objectifs"], s["score_reputation"]
            )
            for s in scores
        ])


async def fetch_stored_scores(mentore_id: str, top_n: int) -> list[dict]:
    """Lit les scores déjà calculés pour un mentoré, classés par score décroissant."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                ms.mentor_id,
                ms.score,
                ms.score_competences,
                ms.score_dispo,
                ms.score_objectifs,
                ms.score_reputation,
                ms.calcule_le,
                u.nom,
                u.prenom,
                u.photo_url,
                pm.domaine,
                pm.note_moyenne,
                pm.nb_sessions,
                ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) AS competences
            FROM matching_scores ms
            JOIN profils_mentor pm    ON pm.id  = ms.mentor_id
            JOIN utilisateurs u       ON u.id   = pm.utilisateur_id
            LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
            LEFT JOIN competences c         ON c.id = mc.competence_id
            WHERE ms.mentore_id = $1
            GROUP BY ms.mentor_id, ms.score, ms.score_competences,
                     ms.score_dispo, ms.score_objectifs, ms.score_reputation,
                     ms.calcule_le, u.nom, u.prenom, u.photo_url,
                     pm.domaine, pm.note_moyenne, pm.nb_sessions
            ORDER BY ms.score DESC
            LIMIT $2
        """, mentore_id, top_n)
        return [dict(r) for r in rows]