import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { buildNodeMap, buildParentToChildren } from "../../database/mock";

@Injectable()
export class PathsService {
  constructor(private readonly prisma: PrismaService) {}

  async attach(body: { parentId: string; childId: string; slug: string }) {
    if (this.prisma.connected) {
      const db = this.prisma.client as any;
      // Write edge and path rows; path computed as parent path || slug
      const parentPaths = await db.path.findMany({
        where: { nodeId: body.parentId },
      });
      const child = await db.node.findUnique({ where: { id: body.childId } });
      if (!child) return { error: "Child node not found" };
      const newPaths = parentPaths.map((p) => ({
        nodeId: body.childId,
        path: `${p.path}.${body.slug}`,
      }));
      await db.edge.upsert({
        where: {
          parentId_childId_label: {
            parentId: body.parentId,
            childId: body.childId,
            label: body.slug,
          },
        },
        update: {},
        create: {
          parentId: body.parentId,
          childId: body.childId,
          label: body.slug,
        },
      });
      for (const np of newPaths) {
        await db.path.upsert({
          where: { nodeId_path: { nodeId: np.nodeId, path: np.path } },
          update: {},
          create: np,
        });
      }
      return { ok: true };
    }
    // Mock fallback: just echo
    return { ok: true };
  }

  async resolve(path: string) {
    if (this.prisma.connected) {
      const db = this.prisma.client as any;
      // Find node with a matching ltree path
      const match = await db.path.findFirst({
        where: { path },
        include: { node: true },
      });
      if (!match) return { node: null, ancestors: [], children: [], path };
      const ancestors = (await db.$queryRaw(
        `SELECT n.* FROM "Path" p JOIN "Node" n ON n.id = p.nodeId WHERE p.path @> $1::ltree ORDER BY n.createdAt`,
        path
      )) as any[];
      const childrenEdges = await db.edge.findMany({
        where: { parentId: match.nodeId },
      });
      const children = await db.node.findMany({
        where: { id: { in: childrenEdges.map((e: any) => e.childId) } },
      });
      return { node: match.node, ancestors, children, path };
    }
    // Mock fallback
    const nodeMap = buildNodeMap();
    const parentToChildren = buildParentToChildren();
    const slugs = path.split("/").filter(Boolean);
    // root = node that never appears as a child
    const childIds = new Set(
      Array.from(parentToChildren.values())
        .flat()
        .map((e) => e.childId)
    );

    const root = Array.from(nodeMap.values()).find((n) => !childIds.has(n.id));

    if (!root) {
      return { node: null, ancestors: [], children: [], path };
    }

    let currentId = root.id;
    let current = root;
    const ancestors: any[] = [];

    for (const slug of slugs.slice(1)) {
      const edges = parentToChildren.get(currentId) || [];
      const next = edges.find((e) => e.slug === slug);
      if (!next) return { node: null, ancestors: [], children: [], path };
      ancestors.push(current);
      currentId = next.childId;
      current = nodeMap.get(currentId)!;
    }

    const children = (parentToChildren.get(currentId) || []).map(
      (e) => nodeMap.get(e.childId)!
    );
    return { node: current, ancestors, children, path };
  }
}
