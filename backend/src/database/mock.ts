export type MockNode = {
  id: string;
  title: string;
  slug: string;
  nodetype: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
};

export type MockEdge = {
  parentId: string;
  childId: string;
  slug: string;
};

// Minimal mock data; can be extended
export const nodes: MockNode[] = [
  // Level 0: Root Space
  {
    id: "1",
    nodetype: "Space",
    title: "Gomanto",
    slug: "gomanto",
    metadata: {
      description: "The root of the knowledge graph, containing all spaces.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Level 1: Subspaces
  {
    id: "2",
    nodetype: "Subspace",
    title: "Art",
    slug: "art",
    metadata: { description: "A subspace for art, artists, and their works." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    nodetype: "Subspace",
    title: "Technology",
    slug: "technology",
    metadata: {
      description: "A subspace for technology, programming, and products.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Level 2: Collections
  {
    id: "3",
    nodetype: "Collection",
    title: "Artists",
    slug: "artists",
    metadata: { description: "A collection of notable artists." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    nodetype: "Collection",
    title: "Programming Languages",
    slug: "programming-languages",
    metadata: { description: "A collection of programming languages." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Level 3: Nodes
  {
    id: "4",
    nodetype: "Person",
    title: "Frida Kahlo",
    slug: "frida-kahlo",
    metadata: {
      description:
        "A Mexican painter known for her many portraits, self-portraits, and works inspired by the nature and artifacts of Mexico.",
      about: {
        born: "1907-07-06",
        died: "1954-07-13",
        nationality: "Mexican",
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    nodetype: "Product",
    title: "React",
    slug: "react",
    metadata: {
      description: "A JavaScript library for building user interfaces.",
      about: {
        creator: "Facebook",
        website: "https://react.dev",
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    nodetype: "Collection",
    title: "Frida's Works",
    slug: "works",
    metadata: { description: "A collection of works by Frida Kahlo." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    nodetype: "MediaItem",
    title: "The Two Fridas",
    slug: "the-two-fridas",
    metadata: {
      about: {
        year: 1939,
        medium: "Oil on canvas",
      },
      imageUrl: "https://picsum.photos/seed/201/600/400",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const edges: MockEdge[] = [
  // Space 'Gomanto' -> Subspace 'Art'
  { parentId: "1", childId: "2", slug: "art" },
  // Space 'Gomanto' -> Subspace 'Technology'
  { parentId: "1", childId: "7", slug: "technology" },

  // Subspace 'Art' -> Collection 'Artists'
  { parentId: "2", childId: "3", slug: "artists" },

  // Collection 'Artists' -> Node 'Frida Kahlo'
  { parentId: "3", childId: "4", slug: "frida-kahlo" },

  // Node 'Frida Kahlo' -> Collection 'Frida's Works' (a nested collection)
  { parentId: "4", childId: "5", slug: "works" },

  // Collection 'Frida's Works' -> Node 'The Two Fridas'
  { parentId: "5", childId: "6", slug: "the-two-fridas" },

  // Subspace 'Technology' -> Collection 'Programming Languages'
  { parentId: "7", childId: "8", slug: "programming-languages" },

  // Collection 'Programming Languages' -> Node 'React'
  { parentId: "8", childId: "9", slug: "react" },
];

export function buildNodeMap() {
  return new Map<string, MockNode>(nodes.map((n) => [n.id, n]));
}

export function buildParentToChildren() {
  const map = new Map<string, { childId: string; slug: string }[]>();
  for (const e of edges) {
    if (!map.has(e.parentId)) map.set(e.parentId, []);
    map.get(e.parentId)!.push({ childId: e.childId, slug: e.slug });
  }
  return map;
}
