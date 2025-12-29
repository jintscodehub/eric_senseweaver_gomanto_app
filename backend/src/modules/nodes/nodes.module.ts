import { Module } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NodesController],
  providers: [NodesService, PrismaService],
})
export class NodesModule {}
