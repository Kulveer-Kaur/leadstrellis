export const getSeedUsers = () => [
  {
    name: process.env.ADMIN_NAME || 'Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@leadstrellis.com').toLowerCase(),
    role: 'ADMIN' as const,
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
];
