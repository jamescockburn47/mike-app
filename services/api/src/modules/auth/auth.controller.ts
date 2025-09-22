import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('providers')
  providers() {
    const keys = {
      google: Boolean(this.config.get('GOOGLE_CLIENT_ID')),
      microsoft: Boolean(this.config.get('MS_CLIENT_ID')),
      newsApi: Boolean(this.config.get('NEWS_API_KEY')),
      spotify: Boolean(this.config.get('SPOTIFY_CLIENT_ID')),
      applemusic: Boolean(this.config.get('APPLE_MUSIC_TEAM_ID')),
    };
    return { providers: keys };
  }
}


