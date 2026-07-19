/**
 * Shared helpers for automotive panel widgets.
 */

export function lines(props: Record<string, unknown>, fallback: string[]): string[] {
  return (props.lines as string[]) ?? fallback;
}

