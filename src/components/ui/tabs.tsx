"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

// TabsList variants
const tabsListVariants = {
  default: "inline-flex h-11 max-w-full items-center justify-start overflow-x-auto overscroll-x-contain rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 text-[var(--text-muted)]",
  pills: "flex w-full flex-wrap justify-start gap-2 bg-transparent p-0",
  grid: "mb-5 grid h-auto w-full grid-cols-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1",
};

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "grid";
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants[variant], className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// TabsTrigger variants
const tabsTriggerVariants = {
  default: "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-[var(--bg-primary)] transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-sm",
  pills: "shrink-0 gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-[background-color,border-color,color] data-[state=active]:border-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10 data-[state=active]:text-[var(--accent-primary)]",
  grid: "rounded-md px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-[background-color,color,box-shadow] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm",
};

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "grid";
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants[variant], className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-[var(--bg-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsListProps, TabsTriggerProps };
