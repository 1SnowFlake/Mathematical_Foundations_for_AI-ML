import type { MDXComponents } from "mdx/types";

/**
 * Root-level MDX component overrides.
 * Every .mdx page uses these by default — custom components
 * like MathBlock are imported directly in each MDX file instead,
 * keeping this file focused on styling overrides for standard HTML tags.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Wrap all MDX content in prose styling
    wrapper: ({ children }) => <div className="prose">{children}</div>,
    ...components,
  };
}
