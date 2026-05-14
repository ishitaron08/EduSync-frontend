"use client";

import Link from "next/link";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";
import type { ReactNode } from "react";

type MagneticLaunchButtonProps = {
  href: string;
  children: ReactNode;
};

export function MagneticLaunchButton({ href, children }: MagneticLaunchButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });
  const rotate = useTransform(springX, [-14, 14], [-1.2, 1.2]);

  const onPointerMove: React.PointerEventHandler<HTMLAnchorElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    x.set(offsetX * 0.18);
    y.set(offsetY * 0.18);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div style={{ x: springX, y: springY, rotate }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
      <Link
        href={href}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="inline-flex items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-500/90 px-5 py-3 text-sm font-medium text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-emerald-400 active:-translate-y-[1px] active:scale-[0.98]"
      >
        {children}
      </Link>
    </motion.div>
  );
}
