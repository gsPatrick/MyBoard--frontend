import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "MyBoard — Gerenciamento de projetos",
  description: "Organize clientes, projetos e prazos em um workspace profissional",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="light" className={inter.variable}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
