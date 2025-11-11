import { IsEmail, IsOptional, IsString } from 'class-validator';

export class OAuthRedirectQueryDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
