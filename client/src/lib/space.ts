// lib/space.ts
import { nodes } from "./mock-data";
import type { Node } from "./types";

/**
 * Resolves the space slug to the canonical space.
 * Defaults to the first Space node if slug not provided.
 */
export function getSpaceSlug(slug?: string): string {
  if (slug) return slug;

  const defaultSpace = nodes.find((n) => n.nodetype === "Space");
  if (!defaultSpace) throw new Error("No default Space found in nodes");

  return defaultSpace.slug;
}

/**
 * Returns the space node object by slug
 */
export function getSpaceNode(slug?: string): Node {
  const spaceSlug = getSpaceSlug(slug);
  const spaceNode = nodes.find(
    (n) => n.nodetype === "Space" && n.slug === spaceSlug
  );
  if (!spaceNode)
    throw new Error(`Space node not found for slug "${spaceSlug}"`);
  return spaceNode;
}
