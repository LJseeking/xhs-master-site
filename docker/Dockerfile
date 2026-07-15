FROM node:20-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs

COPY --chown=nextjs:nodejs ./.next/standalone ./
COPY --chown=nextjs:nodejs ./.next/static ./.next/static
COPY --chown=nextjs:nodejs ./node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs ./node_modules/@prisma ./node_modules/@prisma
COPY --chown=nextjs:nodejs ./public ./public
COPY --chown=nextjs:nodejs ./prisma ./prisma
COPY --chown=nextjs:nodejs ./assets ./assets
COPY --chown=nextjs:nodejs ./profiles ./profiles
COPY --chown=nextjs:nodejs ./prompts ./prompts
COPY --chown=nextjs:nodejs ./local-data ./local-data
COPY --chown=nextjs:nodejs ./entrypoint /app/entrypoint

RUN chmod +x /app/entrypoint

USER nextjs

EXPOSE 3000

CMD ["/app/entrypoint"]
