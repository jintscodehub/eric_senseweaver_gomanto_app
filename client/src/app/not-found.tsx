import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col w-full items-center justify-center gap-4 bg-background text-center"
      )}
    >
      <Frown className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
        Node Not Found
      </h1>
      <p className="max-w-md text-muted-foreground">
        The path you're trying to navigate doesn't exist in the knowledge graph.
        It might be a broken link or a path yet to be created.
      </p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
