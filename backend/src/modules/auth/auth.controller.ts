import { Body, Controller, Post, Get, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, ACCESS_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_MAX_AGE_MS } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, csrfToken: string) {
  const base = { httpOnly: true, secure: isProd, sameSite: isProd ? ('strict' as const) : ('lax' as const) };
  res.cookie('access_token', accessToken, { ...base, maxAge: ACCESS_TOKEN_MAX_AGE_MS, path: '/' });
  res.cookie('refresh_token', refreshToken, { ...base, maxAge: REFRESH_TOKEN_MAX_AGE_MS, path: '/auth' });
  // كوكي غير httpOnly عمداً: يقرأه الفرونت اند ليرسله في هيدر x-csrf-token (نمط double-submit cookie)
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateCredentials(dto.email, dto.password);
    const { accessToken, refreshToken, csrfToken } = await this.authService.issueTokens(user);
    setAuthCookies(res, accessToken, refreshToken, csrfToken);
    const companies = await this.authService.getUserCompanies(user);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, isGroupManager: user.isGroupManager },
      companies,
    };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(@CurrentUser() currentUser: CurrentUserPayload, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const user = await this.authService.getUserById(currentUser.id);
    if (!user) return { ok: false };
    const { accessToken, refreshToken, csrfToken } = await this.authService.issueTokens(user);
    setAuthCookies(res, accessToken, refreshToken, csrfToken);
    return { ok: true };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: CurrentUserPayload, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });
    res.clearCookie('csrf_token', { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    const fullUser = await this.authService.getUserById(user.id);
    if (!fullUser) return { user, companies: [] };
    const companies = await this.authService.getUserCompanies(fullUser);
    return { user, companies };
  }
}
