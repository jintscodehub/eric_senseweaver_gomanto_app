import { Module } from '@nestjs/common';
import { NodetypesService } from './nodetypes.service';
import { NodetypesController } from './nodetypes.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NodetypesController],
  providers: [NodetypesService, PrismaService],
})
export class NodetypesModule {}
