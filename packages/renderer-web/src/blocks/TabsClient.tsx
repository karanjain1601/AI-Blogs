"use client";

import { useState, type ReactNode } from "react";

/**
 * Tab content is rendered on the server and passed in as `content` nodes; this
 * client component only handles which one is visible.
 */
export function TabsClient({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="nb-tabs">
      <div className="nb-tablist" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? "active" : undefined}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="nb-tabpanel">{tabs[active]?.content}</div>
    </div>
  );
}
