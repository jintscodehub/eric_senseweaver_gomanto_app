import type { Node } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { NodeIcon } from "./node-icon";
import React from "react";

type NodeViewProps = {
  node: Node;
  childrenNodes: Node[];
  currentPath: string;
};

function renderMetadataValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

export default function NodeView({
  node,
  childrenNodes,
  currentPath,
}: NodeViewProps) {
  const nodeDetailsMetadataEntries = Object.entries(node.metadata.about ?? {});

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="outline" className="mb-2">
          {node.nodetype}
        </Badge>
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          {node.title}
        </h1>
        {node.metadata.description && (
          <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
            {node.metadata.description}
          </p>
        )}
      </div>

      {node.nodetype === "MediaItem" &&
        (typeof node.metadata.mediaItem === "string" ||
          typeof node.metadata.imageUrl === "string") && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Image
                src={node.metadata.mediaItem ?? node.metadata.imageUrl ?? ""}
                alt={node.title}
                width={500}
                height={500}
                className="object-cover w-full aspect-video"
                data-ai-hint=""
              />
            </CardContent>
          </Card>
        )}

      {nodeDetailsMetadataEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Schema-defined properties for this node.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3 font-code">
              {nodeDetailsMetadataEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="break-words rounded-lg border bg-background/50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {key}
                  </p>
                  <p className="mt-1.5 text-foreground">
                    {renderMetadataValue(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {childrenNodes.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold font-headline mb-4">
            {(() => {
              switch (node.nodetype) {
                case "Space":
                  return "Subspaces";
                case "Subspace":
                  return "Collections";
                case "Collection":
                  return childrenNodes[0]?.nodetype ?? "Items";
                default:
                  return childrenNodes[0]?.nodetype ?? "NodeType";
              }
            })()}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {childrenNodes.map((child) => (
              <Link
                href={`/node/${[currentPath, child.slug].join("/")}`}
                key={child.id}
                className="block hover:no-underline"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                          <NodeIcon
                            nodetype={child.nodetype}
                            className="h-6 w-6 text-secondary-foreground"
                          />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">
                            {child.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {child.nodetype}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {child.metadata.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {child.metadata.description}
                      </p>
                    </CardContent>
                  )}
                  <CardFooter>
                    <div className="flex w-full items-center justify-end">
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
