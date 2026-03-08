import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 ring-offset-white active:scale-[0.99]',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
        secondary: 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50',
        ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <span className={cn(buttonVariants({ variant, size }), className)}>
        {props.children}
      </span>
    )
  }

  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
