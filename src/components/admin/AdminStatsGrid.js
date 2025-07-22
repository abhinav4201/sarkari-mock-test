"use client";

import StatCard from "./StatCard";

export default function AdminStatsGrid({
  statsConfig,
  statsCache,
  loadingKey,
  activeKey,
  onCardClick,
}) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {Object.entries(statsConfig).map(([key, config]) => (
        <StatCard
          key={key}
          title={config.title}
          value={activeKey === key ? statsCache[key] ?? "..." : ""}
          icon={config.icon}
          isLoading={loadingKey === key}
          // --- THIS IS THE FIX ---
          // All cards with an action are now clickable buttons
          onClick={config.action ? () => onCardClick(key) : null}
        />
      ))}
    </div>
  );
}
