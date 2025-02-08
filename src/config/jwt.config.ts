import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
  },
});

// src/config/jwt.constants.ts
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRATION: '1d',
  REFRESH_TOKEN_EXPIRATION: '7d',
};
