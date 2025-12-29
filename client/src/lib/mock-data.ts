import type { Node, Edge } from "./types";

export const nodes: Node[] = [
  // Level 0: Root Space
  {
    id: "1",
    spaceId: "1",
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
    spaceId: "1",
    nodetype: "Subspace",
    title: "Art",
    slug: "art",
    metadata: { description: "A subspace for art, artists, and their works." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    spaceId: "1",
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
    spaceId: "1",
    nodetype: "Collection",
    title: "Artists",
    slug: "artists",
    metadata: { description: "A collection of notable artists." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    spaceId: "1",
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
    spaceId: "1",
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
    spaceId: "1",
    nodetype: "Product",
    title: "React",
    slug: "react",
    metadata: {
      description: "A JavaScript library for building user interfaces.",
      about: { creator: "Facebook", website: "https://react.dev" },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    spaceId: "1",
    nodetype: "Collection",
    title: "Frida's Works",
    slug: "works",
    metadata: { description: "A collection of works by Frida Kahlo." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    spaceId: "1",
    nodetype: "MediaItem",
    title: "The Two Fridas",
    slug: "the-two-fridas",
    metadata: {
      about: { year: 1939, medium: "Oil on canvas" },
      imageUrl: "https://picsum.photos/seed/201/600/400",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const edges: Edge[] = [
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
