import type { Metadata } from "next";
import "./globals.css";
import { SiteNav, SiteFooter } from "@/components/site-shell";
export const metadata: Metadata = { title: "Harsh — Fashion Portfolio", description: "Indo-Western fashion, Indian craft and contemporary silhouettes by Harsh." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><SiteNav/>{children}<SiteFooter/></body></html>; }