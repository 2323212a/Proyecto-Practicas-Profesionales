import type { LucideIcon } from "lucide-react";

export type StatCard = [
  label: string,
  value: string | number,
  icon: LucideIcon,
];

export type ColoredStatCard = [
  label: string,
  value: string | number,
  icon: LucideIcon,
  color: string,
];
