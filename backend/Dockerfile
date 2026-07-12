FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata curl

ENV TZ=Indian/Antananarivo

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN mkdir -p uploads/reports uploads/photos uploads/cv

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]