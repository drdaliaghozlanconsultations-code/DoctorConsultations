import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const ctaVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
        outline:
          'border border-primary/30 bg-card text-primary hover:bg-accent/60',
        soft: 'bg-accent text-accent-foreground hover:bg-accent/70',
        ghost: 'text-foreground/80 hover:bg-muted hover:text-foreground',
      },
      size: {
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'lg' },
  },
)

interface CtaLinkProps
  extends React.ComponentProps<typeof Link>,
    VariantProps<typeof ctaVariants> {}

export function CtaLink({ className, variant, size, ...props }: CtaLinkProps) {
  return (
    <Link className={cn(ctaVariants({ variant, size }), className)} {...props} />
  )
}

export { ctaVariants }
