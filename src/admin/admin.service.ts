import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Role } from '../schemas/role.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>
  ) {}

  async getAllUsers() {
    const users = await this.userModel.find().select('-password').populate('role');
    return { success: true, data: users };
  }

  async getAllRoles() {
    const roles = await this.roleModel.find();
    return { success: true, data: roles };
  }

  async createUser(createUserDto: any) {
    const { username, email, password, roleId } = createUserDto;
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    let roleDoc: any = null;
    if (roleId) {
      roleDoc = await this.roleModel.findById(roleId);
      if (!roleDoc) {
        throw new BadRequestException('Invalid role specified');
      }
    } else {
      roleDoc = await this.roleModel.findOne({ name: 'USER' });
    }

    const newUser = new this.userModel({
      username,
      email,
      password,
      role: roleDoc._id
    });

    await newUser.save();
    return { success: true, message: 'User created successfully', data: { id: newUser._id } };
  }

  async updateUser(id: string, updateUserDto: any, currentUser: any) {
    const userToUpdate = await this.userModel.findById(id);
    if (!userToUpdate) throw new NotFoundException('User not found');

    if (updateUserDto.roleId || updateUserDto.isActive !== undefined) {
      if (id === currentUser._id?.toString() || id === currentUser.id) {
        throw new BadRequestException('Cannot change your own role or status through the admin API. This prevents accidental lockouts.');
      }
    }

    if (updateUserDto.roleId) {
      const roleDoc = await this.roleModel.findById(updateUserDto.roleId);
      if (!roleDoc) throw new BadRequestException('Role not found');
      userToUpdate.role = roleDoc._id;
    }

    if (updateUserDto.isActive !== undefined) {
      userToUpdate.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.password) {
      userToUpdate.password = updateUserDto.password;
    }

    await userToUpdate.save();
    return { success: true, message: 'User updated successfully' };
  }

  async deleteUser(id: string, currentUser: any) {
    if (id === currentUser.id || id === currentUser._id?.toString()) {
      throw new BadRequestException('Cannot delete your own account');
    }
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('User not found');
    return { success: true, message: 'User deleted successfully' };
  }
}
