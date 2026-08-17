import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../core/entities/user.entity';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.refresh_token || null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id: payload.sub })
      .getOne();

    const refreshToken = req.cookies?.refresh_token;
    if (!user || !user.isActive || !user.refreshTokenHash || !refreshToken) {
      throw new UnauthorizedException('جلسة غير صالحة، الرجاء تسجيل الدخول من جديد');
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('جلسة غير صالحة، الرجاء تسجيل الدخول من جديد');
    }
    return { id: user.id, email: user.email, fullName: user.fullName, isGroupManager: user.isGroupManager };
  }
}
