import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'alan@gmail.com';
  const password = 'alan123';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user password
  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  console.log('Password updated successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('New hash:', hashedPassword);
  
  // Verify
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password verification:', isValid);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
