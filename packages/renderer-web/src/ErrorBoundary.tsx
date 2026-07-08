"use client";

import { Component, type ReactNode } from "react";

/**
 * Per-block error boundary — one malformed block can never blank the whole
 * note (renderer contract).
 */
export class BlockErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: true } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.warn("Block failed to render:", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="nb-block-error">This block failed to render.</div>
        )
      );
    }
    return this.props.children;
  }
}
