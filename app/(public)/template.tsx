/**
 * Same enter-animation as the admin side, so the customer flow moves between
 * steps instead of cutting between them.
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
