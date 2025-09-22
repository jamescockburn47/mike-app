import { Body, Controller, Get, Post } from '@nestjs/common';

type Profile = {
  language?: string;
  timezone?: string;
  topics?: string[];
};

let inMemoryProfile: Profile = {};

@Controller('profile')
export class ProfileController {
  @Get()
  get() {
    return inMemoryProfile;
  }

  @Post()
  set(@Body() body: Profile) {
    inMemoryProfile = { ...inMemoryProfile, ...body };
    return inMemoryProfile;
  }
}


