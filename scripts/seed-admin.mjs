import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, '..', 'data', 'admin-users.json');

const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync('Admin@123', salt);

const users = {
  users: [
    {
      id: '1',
      email: 'admin@cityfragrance.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    },
  ],
};

fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
console.log('Admin user seeded successfully!');
console.log('  Email/Username: admin@cityfragrance.com');
console.log('  Password: Admin@123');
