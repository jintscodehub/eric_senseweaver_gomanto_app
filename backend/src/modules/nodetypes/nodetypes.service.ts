import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NodetypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.connected) {
      return (this.prisma.client as any).nodetype.findMany()
    }
    return []
  }

  async findOne(key: string) {
    if (this.prisma.connected) {
      return (this.prisma.client as any).nodetype.findUnique({ where: { key } })
    }
    return null
  }
}
