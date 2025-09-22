import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { calendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  @Get('agenda')
  agenda(@Query('range') range: string = 'today') {
    // Placeholder response
    return { range, events: [] };
  }

  @Post('google/agenda')
  async googleAgenda(@Body() body: { accessToken: string }) {
    return calendarService.fetchGoogleAgenda(body.accessToken);
  }

  @Post('microsoft/agenda')
  async microsoftAgenda(@Body() body: { accessToken: string }) {
    return calendarService.fetchMicrosoftAgenda(body.accessToken);
  }
}


