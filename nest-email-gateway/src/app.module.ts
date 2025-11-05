import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Mailbox } from './entities/mailbox.entity';
import { Event } from './entities/event.entity';
import { ClientsModule } from './clients/clients.module';
import { MailboxesModule } from './mailboxes/mailboxes.module';
import { EventsModule } from './events/events.module';
import { WsModule } from './ws/ws.module';
import { MailModule } from './mail/mail.module';
import { SystemModule } from './system/system.module';
import { ConfigModule } from '@nestjs/config';
import { SettingsModule } from './settings/settings.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: false,
      entities: [User, Client, Mailbox, Event],
    }),
    AuthModule,
    ClientsModule,
    MailboxesModule,
    EventsModule,
    WsModule,
    MailModule,
    SystemModule,
    SettingsModule,
    WebhooksModule,
    WorkerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
