import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { nodes as mockNodes } from '../../database/mock';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    const q = query.toLowerCase()
    if (this.prisma.connected) {
      const results = await (this.prisma.client as any).$queryRaw(
        `SELECT * FROM "Node" WHERE tsv @@ plainto_tsquery('simple', $1) LIMIT 50`,
        q
      ) as any[]
      return results
    }
    return mockNodes.filter(n => n.title.toLowerCase().includes(q))
  }
}
