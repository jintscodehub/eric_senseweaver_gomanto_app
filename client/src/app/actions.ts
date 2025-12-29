'use server';

export type SuggestToolsInput = {
  nodeId: string;
  nodeType: string;
  nodeTitle: string;
  nodeMetadata: string;
}

export type SuggestToolsOutput = {
  suggestions: Array<{
    toolName: string;
    toolDescription: string;
    reason: string;
  }>;
}

async function suggestTools(input: SuggestToolsInput): Promise<SuggestToolsOutput> {
  // Mock implementation for dev/testing; replace with actual AI flow
  const base: SuggestToolsOutput = { suggestions: [] }
  if (input.nodeType === 'Space') {
    base.suggestions.push({ toolName: 'Create Subspace', toolDescription: 'Start a new subspace under this space.', reason: 'Spaces can contain subspaces for organization.' })
  }
  if (input.nodeTitle && input.nodeTitle.length > 0) {
    base.suggestions.push({ toolName: 'Attach to Path', toolDescription: 'Attach this node to another path for multi-context access.', reason: 'Multi-path navigation improves discoverability.' })
  }
  return base
}

export async function getToolSuggestions(
  input: SuggestToolsInput
): Promise<SuggestToolsOutput> {
  try {
    const suggestions = await suggestTools(input);
    return suggestions;
  } catch (error) {
    console.error('Error getting tool suggestions:', error);
    // In a real app, you'd want more robust error handling.
    return { suggestions: [] };
  }
}
