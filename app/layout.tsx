import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "~/lib/auth";
import { LocaleProvider } from "~/lib/i18n";
import { ThemeProvider } from "~/lib/theme";
import Shell from "~/components/Shell";

const noto = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Organiser — จัดชีวิตในที่เดียว",
    template: "%s · Organiser",
  },
  description:
    "ปฏิทิน งาน โน้ต ติดตามอ่านหนังสือ และนับถอยหลังวันสำคัญ — ซิงก์ทุกอุปกรณ์",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${noto.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('organiser:theme')==='dark')document.documentElement.classList.add('dark');else if(localStorage.getItem('organiser:theme')==='light')document.documentElement.classList.remove('dark');else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <LocaleProvider>
          <ThemeProvider>
            <AuthProvider>
              <Shell>{children}</Shell>
            </AuthProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}