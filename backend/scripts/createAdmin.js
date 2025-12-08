// Użycie: node scripts/createAdmin.js email@example.com YourPassword
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Użycie: node scripts/createAdmin.js email password');
    process.exit(1);
  }
  const [email, password] = args;
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    console.error('User already exists');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const u = new User({ email, passwordHash: hash });
  await u.save();
  console.log('Admin user created:', u.email);
  process.exit(0);
})();
