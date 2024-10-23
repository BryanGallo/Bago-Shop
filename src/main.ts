import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //Configurando para poder anteponer 'api' en el endpoint
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
