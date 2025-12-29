import type { NodeTypeKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  FolderKanban,
  Tag,
  User,
  Briefcase,
  Building2,
  Package,
  Calendar,
  FileImage,
  FileText,
  MapPin,
  FileQuestion,
  type LucideProps,
  Library,
  Network
} from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type NodeIconProps = {
  nodetype: NodeTypeKey;
  className?: string;
};

// A map of nodetype to Lucide icon component
const iconMap: Record<NodeTypeKey, ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>> = {
  Space: FolderKanban,
  Subspace: Network,
  Collection: Library,
  Topic: Tag,
  Person: User,
  Role: Briefcase,
  Organisation: Building2,
  Product: Package,
  Event: Calendar,
  MediaItem: FileImage,
  Document: FileText,
  Location: MapPin,
};

export function NodeIcon({ nodetype, className }: NodeIconProps) {
  const IconComponent = iconMap[nodetype] || FileQuestion;

  return <IconComponent className={cn('h-4 w-4', className)} />;
}
