import { Body, Controller, Get, Post } from '@nestjs/common';

type Provider = 'google' | 'microsoft';
type TokenPayload = { provider: Provider; userId: string; accessToken: string; refreshToken?: string };

const inMemoryTokens = new Map<string, TokenPayload>();

@Controller('tokens')
export class TokensController {
  @Post()
  set(@Body() body: TokenPayload) {
    const key = `${body.provider}:${body.userId}`;
    inMemoryTokens.set(key, body);
    return { ok: true };
  }

  @Get()
  list() {
    return Array.from(inMemoryTokens.values());
  }
}


