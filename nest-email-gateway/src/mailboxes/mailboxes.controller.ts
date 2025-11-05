import { Controller, Get, Param, Query, UseGuards, Res, Patch } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { ConfigService } from '@nestjs/config';
@Controller('mailboxes')

export class MailboxesController {
    constructor(private svc: MailboxesService, private config: ConfigService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async all() {
        const data = await this.svc.findAll();
        return { success: true, data };
    }

   
    @Patch(':id/refresh')
    async refresh(@Param('id') id: string) {
        const data = await this.svc.refreshTokenExpiry(Number(id), 3600);
        return { success: true, data };
    }

    @Get('active/count')
    async countActive() {
        const count = await this.svc.countActive();
        return { success: true, count };
    }

    @Get('oauth/:provider')
    async oauthRedirect(@Param('provider') provider: string, @Query('clientId') clientId?: string, @Query('email') email?: string) {
    
        if (provider === 'google') {
            const googleClientId = this.config.get<string>('GMAIL_CLIENT_ID');
            if (!googleClientId) {
                return { success: false, message: 'GMAIL_CLIENT_ID is not configured on the server' };
            }
            const base = this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000';
            const statePayload = clientId || email ? Buffer.from(JSON.stringify({ clientId, email })).toString('base64') : '';
            return {
                success: true,
                redirectUrl: 'https://accounts.google.com/o/oauth2/v2/auth?' +
                    'client_id=' + googleClientId +
                    '&redirect_uri=' + encodeURIComponent(base + '/mailboxes/callback/google') +
                    '&response_type=code' +
                    '&scope=email%20profile' +
                    '&access_type=offline' +
                    (statePayload ? `&state=${encodeURIComponent(statePayload)}` : '')
            };
        }
        if (provider === 'microsoft' || provider === 'outlook') {
            const msClientId = this.config.get<string>('MS_CLIENT_ID') || this.config.get<string>('MICROSOFT_CLIENT_ID');
            if (!msClientId) {
                return { success: false, message: 'MICROSOFT_CLIENT_ID is not configured on the server' };
            }
            const base = this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000';
            const redirect = base + '/mailboxes/callback/microsoft';
            const scope = encodeURIComponent('offline_access openid profile email');
            const statePayload = clientId || email ? Buffer.from(JSON.stringify({ clientId, email })).toString('base64') : '';
            const state = statePayload ? `&state=${encodeURIComponent(statePayload)}` : '';
            const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?'
                + 'client_id=' + msClientId
                + '&redirect_uri=' + encodeURIComponent(redirect)
                + '&response_type=code'
                + '&scope=' + scope
                + state;
            return { success: true, redirectUrl: url };
        }
        return { success: false, message: 'Unknown provider' };
    }

    @Get('callback/:provider')
    async callback(@Param('provider') provider: string, @Query() q: any, @Res() res: any) {

        let email = q.email as string | undefined;
        let clientId = q.clientId as string | undefined;
     
        const rawState = q.state as string | undefined;
        if (rawState) {
            try {
                const decoded = JSON.parse(Buffer.from(String(rawState), 'base64').toString('utf-8'));
                email = decoded?.email || email;
                clientId = decoded?.clientId || clientId;
            } catch {}
        }
        email = email || `user@${provider}.example`;
        const accessToken = 'mock_access_' + Date.now();
        const refreshToken = 'mock_refresh_' + Date.now();
        const frontend = this.config.get<string>('FRONTEND_ORIGIN') || 'http://localhost:3001';
        try {
            await this.svc.saveTokens(email, provider, accessToken, refreshToken, 3600, clientId);
            return res.redirect(frontend + '/dashboard/mailboxes?connected=' + encodeURIComponent(provider));
        } catch (e: any) {
            const msg = encodeURIComponent(e?.message || 'Failed to link mailbox');
            return res.redirect(frontend + '/dashboard/mailboxes?error=' + msg);
        }
    }
}
