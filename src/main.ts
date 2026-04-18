import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register fastify-multipart
  app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  // Serve static files from public
  app.register(fastifyStatic, {
    root: join(process.cwd(), 'public'),
    prefix: '/',
    decorateReply: false
  });

  // Serve static files from uploads
  app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads',
    decorateReply: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      }
    }
  });

  // Redirection hooks
  app.getHttpAdapter().getInstance().addHook('preHandler', (req, res, done) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.redirect('/html/index.html');
      return; // Ensure no further execution
    }
    if (req.url === '/dashboard.html') {
      res.redirect('/html/dashboard.html');
      return; 
    }
    done();
  });

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
