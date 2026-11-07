import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "GymSense - Find your stronger",
  description:
    "Your personal fitness playground. Train with purpose, build consistency, and celebrate every rep.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
