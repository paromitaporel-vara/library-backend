import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'alan@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:');
  console.log('Email:', user.email);
  console.log('Name:', user.name);
  console.log('Role:', user.role);
  console.log('Password hash:', user.password);
  
  // Test password
  const testPassword = 'alan123';
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('\nPassword "alan123" is valid:', isValid);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
