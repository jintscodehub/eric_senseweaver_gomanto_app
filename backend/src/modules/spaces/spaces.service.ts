import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { buildNodeMap, buildParentToChildren } from "../../database/mock";

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSpaceDto: {
    key: string;
    title: string;
    description?: string;
  }) {
    if (this.prisma.connected) {
      const space = await (this.prisma.client as any).space.create({
        data: createSpaceDto,
      });
      return space;
    }
    return { ok: true };
  }

  async getTree(slug: string) {
    if (this.prisma.connected) {
      const root = await (this.prisma.client as any).node.findFirst({
        where: { slug, nodetype: "Space" },
      });
      if (!root) return null;

      const build = async (
        nodeId: string,
        currentPath: string
      ): Promise<any> => {
        const node = await (this.prisma.client as any).node.findUnique({
          where: { id: nodeId },
        });
        const childrenEdges = await (this.prisma.client as any).edge.findMany({
          where: { parentId: nodeId },
        });
        const children = [] as any[];
        for (const e of childrenEdges) {
          const c = await build(e.childId, `${currentPath}/${e.label}`);
          children.push(c);
        }
        return { ...node, path: currentPath, children };
      };
      return build(root.id, root.slug);
    }

    const nodeMap = buildNodeMap();
    const parentToChildren = buildParentToChildren();

    const buildMock = (nodeId: string, currentPath: string): any => {
      const node = nodeMap.get(nodeId);
      const childrenEdges = parentToChildren.get(nodeId) || [];
      const children = childrenEdges.map((e) =>
        buildMock(e.childId, `${currentPath}/${e.slug}`)
      );
      return { ...node, path: currentPath, children };
    };

    const spaceRoot = [...nodeMap.values()].find((n) => n.nodetype === "Space");

    if (!spaceRoot) return null;

    return buildMock(spaceRoot.id, spaceRoot.slug);
  }
}
