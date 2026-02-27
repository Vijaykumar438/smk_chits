import { redirect } from "next/navigation";
import { defaultLocale } from "@/dictionaries";

// Root page redirects to default locale
export default function RootPage() {
  redirect(`/${defaultLocale}/dashboard`);
}
