"use client";

import { LightningBoltIcon, PersonIcon, ReloadIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";

const prompts = [
  "Rebalance M12 timetable around robotics lab constraints",
  "Detect overlap between Grade 9 mentorship and chemistry practical",
  "Sequence revision windows by cognitive load and urgency"
];

const prioritySeed = [
  { id: "alina", name: "Alina Mercer", focus: "Biology sprint", score: 97.2 },
  { id: "jules", name: "Jules Ortega", focus: "Math remediation", score: 94.8 },
  { id: "sanaa", name: "Sanaa Wilder", focus: "Chem practical prep", score: 92.1 }
];

const MotionSignals = memo(function MotionSignals() {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-emerald-300/80"
          animate={{ scale: activeDot === index ? [1, 1.45, 1] : 1, opacity: activeDot === index ? [0.5, 1, 0.5] : 0.35 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", type: "spring", stiffness: 100, damping: 20 }}
        />
      ))}
    </div>
  );
});

const AutoPriorityList = memo(function AutoPriorityList() {
  const [items, setItems] = useState(prioritySeed);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setItems((current) => {
        const reordered = [...current];
        const first = reordered.shift();
        if (first) reordered.push(first);
        return reordered;
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <motion.ul className="space-y-2" layout>
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            layout
            layoutId={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.08 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-200">{item.name}</p>
              <p className="font-[family-name:var(--font-jetbrains)] text-xs text-emerald-300">{item.score.toFixed(1)}%</p>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{item.focus}</p>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
});

export function HeroMotionPanel() {
  const [step, setStep] = useState(0);
  const currentPrompt = useMemo(() => prompts[step], [step]);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % prompts.length);
    }, 3200);
    return () => window.clearInterval(stepTimer);
  }, []);

  return (
    <section className="rounded-[2.5rem] border border-zinc-800/90 bg-zinc-950/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.35)] md:p-8">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live command lane</p>
          <MotionSignals />
        </div>

        <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2 text-zinc-300">
            <LightningBoltIcon className="h-4 w-4 text-emerald-300" />
            <p className="text-sm">Scheduler command stream</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPrompt}
              className="mt-3 font-[family-name:var(--font-jetbrains)] text-xs text-zinc-400"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {currentPrompt}
            </motion.p>
          </AnimatePresence>
          <motion.div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
            initial={false}
            animate={{ opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", type: "spring", stiffness: 100, damping: 20 }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-emerald-300/70"
              animate={{ x: ["-10%", "210%"] }}
              transition={{ duration: 1.7, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </motion.div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-zinc-300">
            <PersonIcon className="h-4 w-4 text-emerald-300" />
            <p className="text-sm">Adaptive priority loop</p>
          </div>
          <AutoPriorityList />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-300">Stream health</p>
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 px-2.5 py-1 text-xs text-emerald-300"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", type: "spring", stiffness: 100, damping: 20 }}
            >
              <ReloadIcon className="h-3 w-3" />
              syncing
            </motion.span>
          </div>
          <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-xs text-zinc-400">47.2% week-load rebalance already resolved.</p>
        </div>
      </div>
    </section>
  );
}
