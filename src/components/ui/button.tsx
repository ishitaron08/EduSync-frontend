"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        filled:
          "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-[0_8px_18px_oklch(47%_0.100_186_/_0.18)] hover:bg-[var(--accent-secondary)] active:translate-y-px",
        ghost:
          "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-elevated)] active:translate-y-px",
        outline:
          "border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]",
        default:
          "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-[0_8px_18px_oklch(47%_0.100_186_/_0.18)] hover:bg-[var(--accent-secondary)] active:translate-y-px",
        destructive: "bg-[var(--accent-danger)] text-[var(--text-inverse)] shadow-sm hover:brightness-105 active:translate-y-px"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "filled",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const v = variant === "outline" ? "ghost" : variant;
    return (
      <Comp
        className={cn(buttonVariants({ variant: v, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
