import type { ComponentType } from "react";
import type { Block, BlockType } from "@notes/blocks";

/**
 * React Native renderer for blocks (Phase 4).
 *
 * Mirrors `@notes/renderer-web` but with React Native components. Mermaid,
 * code, and math render via a WebView on native. This placeholder defines the
 * shared registry contract the mobile app will consume.
 */
export type BlockComponent<T extends Block = Block> = ComponentType<{ block: T }>;

export type BlockRegistry = Partial<Record<BlockType, BlockComponent>>;

export const nativeRegistry: BlockRegistry = {};
