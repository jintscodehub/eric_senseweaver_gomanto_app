import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { randomUUID } from "crypto";

function mockNode(data: {
  spaceId: string;
  nodetypeKey: string;
  title: string;
  slug: string;
  metadata?: any;
  parentId?: string;
  parentPath?: string;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const path = data.parentPath ? `${data.parentPath}/${data.slug}` : data.slug;

  return {
    id,
    spaceId: data.spaceId,
    title: data.title,
    slug: data.slug,
    nodetype: data.nodetypeKey,
    metadata: data.metadata ?? {},
    path,
    children: [],
    createdAt: now,
    updatedAt: now,
  };
}

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNodeDto: {
    spaceId: string;
    nodetypeKey: string;
    title: string;
    slug: string;
    metadata?: any;
    parentId?: string;
  }) {
    console.log("🔥 NodesService.create CALLED", createNodeDto);

    if (!this.prisma.connected) {
      // Build parentPath if parentId provided (for realistic mock path)
      let parentPath = "";
      if (createNodeDto.parentId) {
        // For mock, we can pretend parent path is 'parent-slug'
        parentPath = `parent-${createNodeDto.parentId}`;
      }

      return mockNode({ ...createNodeDto, parentPath });
    }

    return this.prisma.client.$transaction(async (tx) => {
      // 1️⃣ Resolve nodetype
      const nodetype = await tx.nodetype.findUniqueOrThrow({
        where: { key: createNodeDto.nodetypeKey },
      });

      // 2️⃣ Create node
      const node = await tx.node.create({
        data: {
          spaceId: createNodeDto.spaceId,
          nodetypeId: nodetype.id,
          title: createNodeDto.title,
          metadata: createNodeDto.metadata ?? {},
        },
      });

      // 3️⃣ Create edge (if child)
      let path = createNodeDto.slug;

      if (createNodeDto.parentId) {
        const parentPath = await tx.path.findFirstOrThrow({
          where: { nodeId: createNodeDto.parentId },
        });

        path = `${parentPath.path}/${createNodeDto.slug}`;

        await tx.edge.create({
          data: {
            spaceId: createNodeDto.spaceId,
            parentId: createNodeDto.parentId,
            childId: node.id,
            slug: createNodeDto.slug,
          },
        });
      }

      // 4️⃣ Create path
      await tx.path.create({
        data: {
          spaceId: createNodeDto.spaceId,
          nodeId: node.id,
          path,
        },
      });

      // 5️⃣ Return FULL TreeNode
      return {
        id: node.id,
        spaceId: node.spaceId,
        title: node.title,
        slug: createNodeDto.slug,
        nodetype: createNodeDto.nodetypeKey,
        metadata: node.metadata,
        path,
        children: [],
        createdAt: node.createdAt.toISOString(),
        updatedAt: node.updatedAt.toISOString(),
      };
    });
  }

  async update(id: string, updateNodeDto: any) {
    if (this.prisma.connected) {
      return (this.prisma.client as any).node.update({
        where: { id },
        data: updateNodeDto,
      });
    }
    return {
      id,
      ...updateNodeDto,
      updatedAt: new Date().toISOString(),
    };
  }

  async findOne(id: string) {
    if (this.prisma.connected) {
      return (this.prisma.client as any).node.findUnique({ where: { id } });
    }
    return null;
  }

  async remove(id: string) {
    if (this.prisma.connected) {
      return (this.prisma.client as any).node.delete({ where: { id } });
    }
    return { id, deleted: true };
  }
}
