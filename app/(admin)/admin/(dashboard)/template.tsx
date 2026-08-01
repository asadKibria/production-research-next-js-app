/**
 * A template (rather than a layout) remounts on every navigation, which is what
 * lets the CSS enter-animation run each time. It is the whole reason moving
 * between admin pages no longer cuts abruptly.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
