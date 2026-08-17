import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../core/entities/user.entity';
import { UserCompanyRole } from '../core/entities/user-company-role.entity';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserCompanyRole) private readonly rolesRepo: Repository<UserCompanyRole>,
    private readonly jwtService: JwtService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    return user;
  }

  async issueTokens(user: User) {
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: REFRESH_TOKEN_TTL,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(user.id, { refreshTokenHash });

    const csrfToken = crypto.randomBytes(24).toString('hex');

    return { accessToken, refreshToken, csrfToken };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.update(userId, { passwordHash, mustChangePassword: false });
  }

  // كل الشركات المسموح للمستخدم الدخول عليها مع الدور في كل شركة؛ مدير المجموعة يرى كل الشركات بدور group_manager
  async getUserCompanies(user: User) {
    if (user.isGroupManager) {
      const companies = await this.rolesRepo.manager.query(`SELECT id, name FROM companies WHERE "isActive" = true ORDER BY name`);
      return companies.map((c: any) => ({ companyId: c.id, companyName: c.name, role: 'group_manager' }));
    }
    const roles = await this.rolesRepo.find({ where: { userId: user.id }, relations: { company: true } });
    return roles
      .filter((r) => r.company?.isActive)
      .map((r) => ({ companyId: r.companyId, companyName: r.company?.name, role: r.role }));
  }
}
