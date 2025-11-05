import { Body, Controller, Get, Post, UseGuards, Req,UseInterceptors, UploadedFile  } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';

@Controller('mail')
export class MailController {
    constructor(private svc: MailService) { }
   
    
    @UseGuards(JwtAuthGuard)
    @Post('send')
    @UseInterceptors(FileInterceptor('attachment'))
    async send(
      @Body() dto: any,
      @Req() req: any,
      @UploadedFile() file?: MulterFile
    ) {
      let data = dto;
      if (!data || Object.keys(data).length === 0) {
        data = req.body;
      }
      if (file) {

        data.attachment = {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      }
     
      const job = await this.svc.enqueueSend(data);
      return { success: true, jobId: job.id };
    }

    @UseGuards(JwtAuthGuard)
    @Get('queue')
    async queue() {
        const q = await this.svc.listQueue();
        return { success: true, data: q };
    }
}
