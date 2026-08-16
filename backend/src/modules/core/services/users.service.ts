import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserCompanyRole } from '../entities/user-company-role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserCompanyRole) private readonly rolesRepo: Repository<UserCompanyRole>,
  ) {}

  async findAll() {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    const roles = await this.rolesRepo.find({ relations: { company: true } });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      isActive: u.isActive,
      isGroupManager: u.isGroupManager,
      createdAt: u.createdAt,
      companyRoles: roles
        .filter((r) => r.userId === u.id)
        .map((r) => ({ companyId: r.companyId, companyName: r.company?.name, role: r.role })),
    }));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('يوجد مستخدم مسجّل بهذا البريد الإلكتروني بالفعل');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        isGroupManager: dto.isGroupManager ?? false,
        role: dto.isGroupManager ? 'group_manager' : 'employee',
      }),
    );

    if (dto.companyRoles?.length) {
      await this.rolesRepo.save(
        dto.companyRoles.map((cr) => this.rolesRepo.create({ userId: user.id, companyId: cr.companyId, role: cr.role })),
      );
    }
    return this.findOne(user.id);
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const roles = await this.rolesRepo.find({ where: { userId: id }, relations: { company: true } });
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      isGroupManager: user.isGroupManager,
      createdAt: user.createdAt,
      companyRoles: roles.map((r) => ({ companyId: r.companyId, companyName: r.company?.name, role: r.role })),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.isGroupManager !== undefined) {
      user.isGroupManager = dto.isGroupManager;
      user.role = dto.isGroupManager ? 'group_manager' : 'employee';
    }
    if (dto.newPassword) {
      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }
    await this.usersRepo.save(user);

    if (dto.companyRoles) {
      await this.rolesRepo.delete({ userId: id });
      if (dto.companyRoles.length) {
        await this.rolesRepo.save(
          dto.companyRoles.map((cr) => this.rolesRepo.create({ userId: id, companyId: cr.companyId, role: cr.role })),
        );
      }
    }
    return this.findOne(id);
  }

  // تعطيل بدل الحذف الفعلي، حفاظاً على سلامة السجلات التاريخية المرتبطة بالمستخدم
  async deactivate(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    user.isActive = false;
    user.refreshTokenHash = null;
    await this.usersRepo.save(user);
    return this.findOne(id);
  }
}
