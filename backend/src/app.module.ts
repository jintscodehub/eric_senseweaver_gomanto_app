import { Module } from '@nestjs/common';
import { SpacesModule } from './modules/spaces/spaces.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { PathsModule } from './modules/paths/paths.module';
import { NodetypesModule } from './modules/nodetypes/nodetypes.module';
import { SearchModule } from './modules/search/search.module';
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
    SpacesModule,
    NodesModule,
    PathsModule,
    NodetypesModule,
    SearchModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
