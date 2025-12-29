import { Module } from '@nestjs/common';
import { PathsService } from './paths.service';
import { PathsController } from './paths.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PathsController],
  providers: [PathsService, PrismaService],
})
export class PathsModule {}
