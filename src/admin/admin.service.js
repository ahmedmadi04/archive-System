const { User } = require('../schemas/user.schema');
const { Role } = require('../schemas/role.schema');

class AdminService {
  async getAllUsers() {
    const users = await User.find().select('-password').populate('role');
    return { success: true, data: users };
  }

  async createUser(userData) {
    const { username, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const user = await User.create({
      username,
      email,
      password,
      role
    });

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    };
  }

  async getAllRoles() {
    const roles = await Role.find().populate('permissions');
    return { success: true, data: roles };
  }

  async createRole(roleData) {
    const { name, description, permissions } = roleData;
    
    const existingRole = await Role.findOne({ name: name.toUpperCase() });
    if (existingRole) {
      throw new Error('Role already exists');
    }

    const role = await Role.create({
      name,
      description,
      permissions
    });

    return { success: true, data: role };
  }
}

const adminService = new AdminService();
module.exports = { adminService };
