import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "GymSense",
  description:
    "Your personal fitness playground. Train with purpose, build consistency, and celebrate every rep.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Extensions may add root attributes before hydration. This only suppresses
    // differences on html/body themselves; app descendants retain hydration checks.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
