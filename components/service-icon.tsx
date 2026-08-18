import {
  Stethoscope,
  Clock,
  Heart,
  FileText,
  Leaf,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const map: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  clock: Clock,
  heart: Heart,
  'file-text': FileText,
  leaf: Leaf,
  video: Video,
}

export function ServiceIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = map[name] ?? Stethoscope
  return <Icon className={cn('size-6', className)} aria-hidden="true" />
}
