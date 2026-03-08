/**
 * Theme Provider - No longer needed!
 * Theme is now initialized automatically when the store is created.
 * This component is kept for backward compatibility but does nothing.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
