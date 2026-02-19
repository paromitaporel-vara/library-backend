import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
  origin: 'http://localhost:4000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', '..', "uploads", "profiles"), {
    prefix: '/uploads/profiles/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
