// require('ts-node/register'); - Removed for pure JS

const mongoose = require('mongoose');
const { User } = require('../src/schemas/user.schema');
const { Role } = require('../src/schemas/role.schema');
const { Permission } = require('../src/schemas/permission.schema');
require('dotenv').config();


const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-system');

        console.log('🌱 Seeding database...');

        // Clear existing data for fresh seed
        await User.deleteMany({});
        await Permission.deleteMany({});
        await Role.deleteMany({});
        console.log('✓ Cleared existing users, permissions and roles');


        // Create permissions

        const permissions = [
            // Forms permissions
            { name: 'forms_create', description: 'Create new forms', resource: 'forms', action: 'create' },
            { name: 'forms_read', description: 'View forms', resource: 'forms', action: 'read' },
            { name: 'forms_update', description: 'Update forms', resource: 'forms', action: 'update' },
            { name: 'forms_delete', description: 'Delete forms', resource: 'forms', action: 'delete' },

            // Users permissions
            { name: 'users_manage', description: 'Manage users', resource: 'users', action: 'manage' },

            // Roles permissions
            { name: 'roles_manage', description: 'Manage roles', resource: 'roles', action: 'manage' },

            // Permissions permissions
            { name: 'permissions_manage', description: 'Manage permissions', resource: 'permissions', action: 'manage' }
        ];

        console.log('Creating permissions...');
        const createdPermissions = [];
        for (const perm of permissions) {
            const permission = await Permission.create({
                ...perm,
                name: perm.name.toUpperCase()
            });
            console.log(`✓ Created permission: ${permission.name}`);
            createdPermissions.push(permission);
        }




        // Create roles
        const roles = [
            {
                name: 'ADMIN',
                description: 'Administrator with full access',
                permissions: createdPermissions.map(p => p._id),
                isSystemRole: true
            },
            {
                name: 'USER',
                description: 'Regular user with basic access',
                permissions: createdPermissions.filter(p =>
                    ['forms_create', 'forms_read', 'forms_update'].includes(p.name)
                ).map(p => p._id),
                isSystemRole: true
            }
        ];

        console.log('Creating roles...');
        const createdRoles = [];
        for (const roleData of roles) {
            let role = await Role.findOne({ name: roleData.name });
            if (!role) {
                role = await Role.create(roleData);
                console.log(`✓ Created role: ${roleData.name}`);
            }
            createdRoles.push(role);
        }

        // Create admin user
        const adminRole = createdRoles.find(r => r.name === 'ADMIN');
        const adminUser = await User.findOne({ email: 'admin@example.com' });

        if (!adminUser) {
            const admin = await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: adminRole._id,
                isActive: true
            });
            console.log('✓ Created admin user: admin@example.com / admin123');
        } else {
            console.log('✓ Admin user already exists');
        }

        console.log('🎉 Database seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();