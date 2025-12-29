import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { SpacesService } from "./spaces.service";

@Controller("spaces")
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  create(@Body() createSpaceDto: any) {
    return this.spacesService.create(createSpaceDto);
  }

  // @Get(':id/tree')
  // getTree(@Param('id') id: string) {
  //   return this.spacesService.getTree(id);
  // }
  @Get(":slug/tree")
  getTree(@Param("slug") slug: string) {
    return this.spacesService.getTree(slug);
  }
}
