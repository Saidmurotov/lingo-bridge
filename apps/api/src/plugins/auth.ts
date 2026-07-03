import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from 'shared';
import { AppError } from '../lib/errors';

export interface JwtUser {
  sub: string;
  role: Role;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError('UNAUTHORIZED', "Token yo'q yoki yaroqsiz");
    }
  });

  app.decorate('requireRole', (...roles: Role[]) => {
    return async (request: FastifyRequest) => {
      try {
        await request.jwtVerify();
      } catch {
        throw new AppError('UNAUTHORIZED', "Token yo'q yoki yaroqsiz");
      }
      if (!roles.includes(request.user.role)) {
        throw new AppError('FORBIDDEN', 'Ruxsat yetarli emas');
      }
    };
  });
});
