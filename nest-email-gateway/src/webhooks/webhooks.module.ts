import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WorkerModule } from '../worker/worker.module.js';

@Module({
  imports: [WorkerModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
