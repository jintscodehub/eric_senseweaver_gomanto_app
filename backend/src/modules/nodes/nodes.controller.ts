import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { NodesService } from "./nodes.service";

@Controller("nodes")
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  create(@Body() createNodeDto: any) {
    console.log("🚨 CONTROLLER HIT");
    return this.nodesService.create(createNodeDto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateNodeDto: any) {
    return this.nodesService.update(id, updateNodeDto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.nodesService.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.nodesService.remove(id);
  }
}
