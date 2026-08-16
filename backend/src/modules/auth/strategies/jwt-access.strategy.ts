import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../core/entities/user.entity';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.access_token || null;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('المستخدم غير موجود أو معطّل');
    }
    // req.user سيصبح هذا الكائن
    return { id: user.id, email: user.email, fullName: user.fullName, isGroupManager: user.isGroupManager };
  }
}
