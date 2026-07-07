import { codeToHtml } from "shiki";

const THEMES = { light: "github-light", dark: "github-dark" } as const;

/**
 * Highlight code to HTML with dual light/dark themes (CSS-variable based, so a
 * single render works for both themes — the app picks colors via CSS).
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: lang || "text",
      themes: THEMES,
      defaultColor: false,
    });
  } catch {
    // Unknown/unsupported language → render as plain text.
    return await codeToHtml(code, {
      lang: "text",
      themes: THEMES,
      defaultColor: false,
    });
  }
}
