"use client";
// Page transition wrapper for public routes — smooth fade/slide on navigation.
import { PageTransition } from "@/components/site/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
