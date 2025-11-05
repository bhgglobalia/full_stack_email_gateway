import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mailbox]), EventsModule],
  providers: [MailService],
  controllers: [MailController],
})
export class MailModule {}
