"use client";
// AdminShell — the admin panel's authenticated shell.
//
// Receives the session as a PROP from the server-side admin layout (which
// already verified getServerSession). This means NO client-side useSession()
// race condition — the server guarantees the user is authenticated before
// this component ever renders. The shell is pure presentation: sidebar +
// top bar + theme toggle + logout.
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Mail,
  LogOut,
  Menu,
  Moon,
  Sun,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/lead-gen", label: "Lead Gen", icon: Megaphone },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/patents", label: "Patents", icon: FileText },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/admin/data-requests", label: "Data Requests", icon: ShieldCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Emails", icon: Mail },
];

function sectionTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/lead-gen")) return "Lead Gen";
  for (const item of NAV) {
    if (item.href !== "/admin" && pathname.startsWith(item.href)) return item.label;
  }
  return "Admin";
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9"
    >
      {mounted ? (
        theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <span className="h-4 w-4" />
      )}
    </Button>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-4 py-4 border-b">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">
          Patent<span className="text-primary">Sale</span>
        </div>
        <div className="text-[11px] text-muted-foreground">Admin Console</div>
      </div>
    </Link>
  );
}

function UnauthenticatedRedirect() {
  // This should never render — the server layout redirects before this
  // component loads. Kept as a defensive fallback only.
  React.useEffect(() => {
    window.location.href = "/admin/login";
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Sparkles className="size-6 animate-pulse text-muted-foreground" />
    </div>
  );
}

export function AdminShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Defensive fallback — should never hit because the server layout already
  // verified the session. But if it somehow does, bounce to login.
  if (!session?.user) {
    return <UnauthenticatedRedirect />;
  }

  const adminEmail = session.user.email || "admin";
  const title = sectionTitle(pathname);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card/30">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 sm:px-6">
          {/* Mobile sidebar (Sheet) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Open navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 flex flex-col">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <Brand />
              <div className="flex-1 overflow-y-auto">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/admin/login" });
                  }}
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {adminEmail.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground max-w-[180px] truncate">{adminEmail}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
