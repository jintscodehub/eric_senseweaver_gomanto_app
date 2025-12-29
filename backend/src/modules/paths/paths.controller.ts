import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PathsService } from './paths.service';

@Controller('paths')
export class PathsController {
  constructor(private readonly pathsService: PathsService) {}

  @Post('attach')
  attach(@Body() attachDto: any) {
    return this.pathsService.attach(attachDto);
  }

  @Get('resolve/:path(*)')
  resolve(@Param('path') path: string) {
    return this.pathsService.resolve(path);
  }
}
