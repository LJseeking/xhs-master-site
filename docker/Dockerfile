FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --chown=nextjs:nodejs ./.next/standalone ./
COPY --chown=nextjs:nodejs ./.next/static ./.next/static
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
