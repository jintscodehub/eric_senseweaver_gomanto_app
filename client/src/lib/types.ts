export type NodeTypeKey =
  | "Space"
  | "Subspace"
  | "Collection"
  | "Topic"
  | "Person"
  | "Role"
  | "Organisation"
  | "Product"
  | "Event"
  | "MediaItem"
  | "Document"
  | "Location"
  | (string & {});

/* =========================
   Metadata
========================= */

export type NodeDetailsMetadataValue = string | number | boolean;

export type NodeDetailsMetadata = Record<string, NodeDetailsMetadataValue>;

export interface NodeMetadata {
  description?: string;
  imageUrl?: string;
  mediaItem?: string;
  about?: NodeDetailsMetadata;
  [key: string]: unknown;
}

/* =========================
   Core Graph Types
========================= */

export interface Node {
  id: string;
  spaceId: string;
  nodetype: NodeTypeKey;
  title: string;
  slug: string;
  metadata: NodeMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface Edge {
  parentId: string;
  childId: string;
  slug: string;
}

export interface TreeNode extends Node {
  spaceId: string;
  path: string;
  children: TreeNode[];
}

export interface ResolvedPath {
  node: TreeNode | null;
  ancestors: TreeNode[];
  children: TreeNode[];
  path: string;
}
