# frontend/Dockerfile
# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

# --- AJOUT : déclarer les ARG et les exposer en ENV avant le build ---
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
# ----------------------------------------------------------------------

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev incluses, nécessaires pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Construire l'application Next.js
# Next.js va maintenant "graver" les bonnes valeurs NEXT_PUBLIC_* dans le bundle
RUN npm run build

# Étape 2 : Production
FROM node:20-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]