"use client";

import { useEffect, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useSpring, useTransform } from "framer-motion";

type MetricCardProps = {
  icon: ReactNode;
  title: string;
  value: number;
  status: string;
  tone: "good" | "moderate" | "elevated" | "risk" | "high";
  points: number[];
};

export function MetricCard({ icon, title, value, status, tone, points }: MetricCardProps) {
  const springValue = useSpring(value, { stiffness: 110, damping: 18, mass: 0.55 });
  const roundedValue = useTransform(springValue, (latest) => Math.round(latest));
  useEffect(() => {
    springValue.set(value);
  }, [springValue, value]);
  const safePoints = points.length > 1 ? points : [value - 4, value - 2, value, value + 1];
  const max = Math.max(...safePoints, 100);
  const min = Math.min(...safePoints, 0);
  const range = Math.max(max - min, 1);
  const polyline = safePoints
    .map((point, index) => {
      const x = (index / (safePoints.length - 1)) * 110;
      const y = 42 - ((point - min) / range) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <motion.article
      className={clsx("metric-card", `tone-${tone}`)}
      whileHover={{ y: -6, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <div className="metric-card__top">
        <span className="metric-card__icon">{icon}</span>
        <span className="metric-card__status">{status}</span>
      </div>
      <div>
        <p className="eyebrow">{title}</p>
        <div className="metric-card__value">
          <motion.span className="metric-card__number">{roundedValue}</motion.span>
          <span>%</span>
        </div>
      </div>
      <svg className="metric-card__sparkline" viewBox="0 0 110 48" role="img" aria-label={`${title} trend`}>
        <defs>
          <linearGradient id={`spark-${title.replace(/\s+/g, "-")}`} x1="0%" x2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.article>
  );
}
