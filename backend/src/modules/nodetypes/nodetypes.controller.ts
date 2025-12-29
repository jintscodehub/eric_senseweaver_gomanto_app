import { Controller, Get, Param } from '@nestjs/common';
import { NodetypesService } from './nodetypes.service';

@Controller('nodetypes')
export class NodetypesController {
  constructor(private readonly nodetypesService: NodetypesService) {}

  @Get()
  findAll() {
    return this.nodetypesService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.nodetypesService.findOne(key);
  }
}
