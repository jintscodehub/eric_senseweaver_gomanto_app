'use client';

import type { Node } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getToolSuggestions } from '@/app/actions';
import type { SuggestToolsOutput } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, PlusCircle, Link as LinkIcon, AlertTriangle } from 'lucide-react';

type IntelligentToolSuggestionsProps = {
  node: Node;
};

const toolIcons: { [key: string]: React.ElementType } = {
    'Create Subspace': PlusCircle,
    'Attach to Path': LinkIcon,
    default: Lightbulb,
};

export default function IntelligentToolSuggestions({ node }: IntelligentToolSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestToolsOutput['suggestions']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true);
      setError(null);
      try {
        const result = await getToolSuggestions({
          nodeId: node.id,
          nodeType: node.nodetype,
          nodeTitle: node.title,
          nodeMetadata: JSON.stringify(node.metadata),
        });
        setSuggestions(result.suggestions);
      } catch (err) {
        setError('Failed to fetch AI suggestions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [node.id, node.nodetype, node.title, node.metadata]);

  return (
    <div>
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Intelligent Suggestions
        </h2>

        {loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-24 mt-4" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-24 mt-4" />
                    </CardContent>
                </Card>
            </div>
        )}

        {error && (
             <Card className="border-destructive/50">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
             </Card>
        )}

        {!loading && !error && suggestions.length === 0 && (
            <p className="text-muted-foreground">No suggestions available for this node right now.</p>
        )}

        {!loading && !error && suggestions.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {suggestions.map((suggestion, index) => {
                    const Icon = toolIcons[suggestion.toolName] || toolIcons.default;
                    return (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon className="h-5 w-5 text-accent-foreground" />
                                    {suggestion.toolName}
                                </CardTitle>
                                <CardDescription>{suggestion.toolDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold">Reason:</p>
                                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                                </div>
                                <Button variant="secondary">
                                    Use Tool
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        )}
    </div>
  );
}
