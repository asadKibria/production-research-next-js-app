import { LanguageProvider } from "@/app/lib/i18n/LanguageProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
