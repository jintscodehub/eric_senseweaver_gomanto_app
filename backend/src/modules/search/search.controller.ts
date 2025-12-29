import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter "q" is required.');
    }
    return this.searchService.search(query);
  }
}
