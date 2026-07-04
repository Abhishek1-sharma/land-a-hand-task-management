import React from "react";

export default function StatCard({ label, value, tone = "neutral" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{Number(value || 0)}</strong>
    </article>
  );
}
