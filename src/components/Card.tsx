
import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header fw-bold">
        {title}
      </div>

      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
