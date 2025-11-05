import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(private svc: ClientsService) { }

    @Get()
    async all() {
        const data = await this.svc.findAll();
        return { success: true, data };
    }

    @Post()
    async create(@Body() body: any) {
        const data = await this.svc.create(body);
        return { success: true, data };
    }
}
