import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(` Backend listening on http://localhost:${port}`);

  if (process.env.NGROK_AUTOSTART === 'true' && !process.env.PUBLIC_URL) {
    try {
      const mod: any = await import('ngrok');
      const ngrok = mod && mod.default ? mod.default : mod;
      const url: string = await ngrok.connect({
        addr: port,
        authtoken: process.env.NGROK_AUTHTOKEN,
        proto: 'http',
        region: process.env.NGROK_REGION || undefined,
      });
      process.env.PUBLIC_URL = url;
      console.log(` Ngrok tunnel established: ${url}`);
    } catch (err: any) {
      console.error(' Failedllllll to start ngrok automatically. Set PUBLIC_URL manually if needed.', err?.message || err);
    }
  }
}
bootstrap();
