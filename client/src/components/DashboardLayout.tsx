import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BriefcaseBusiness, Compass, LogOut, PanelLeft, Scale, UserRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: Compass, label: "Resumen", path: "/" },
  { icon: BriefcaseBusiness, label: "Ofertas", path: "/ofertas" },
  { icon: Scale, label: "Comparador", path: "/comparar" },
  { icon: UserRound, label: "Mi perfil", path: "/perfil" },
];

const SIDEBAR_WIDTH_KEY = "byscador-sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 216;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <div className="login-frame"><div className="login-card"><p className="eyebrow">Byscador Privado</p><h1>Tu búsqueda, con criterio.</h1><p>Inicia sesión para consultar tu perfil profesional y tus oportunidades guardadas.</p><Button onClick={() => startLogin()} size="lg" className="w-full">Acceder a mi espacio</Button></div></div>;
  }

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const active = menuItems.find(item => item.path === location);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [isResizing, setSidebarWidth]);

  return <>
    <div className="relative" ref={sidebarRef}>
      <Sidebar collapsible="icon" className="byscador-sidebar" disableTransition={isResizing}>
        <SidebarHeader className="h-22 px-4 py-5">
          <div className="flex items-center gap-3"><button onClick={toggleSidebar} className="brand-mark" aria-label="Contraer navegación"><PanelLeft className="h-4 w-4" /></button><div className="group-data-[collapsible=icon]:hidden"><p className="brand-name">Byscador</p><p className="brand-subtitle">Ofertas · España</p></div></div>
        </SidebarHeader>
        <SidebarContent className="pt-4"><p className="nav-label group-data-[collapsible=icon]:hidden">GESTIONAR</p><SidebarMenu className="px-3">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="nav-entry"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
        <SidebarFooter className="p-3"><div className="source-note group-data-[collapsible=icon]:hidden"><span className="status-dot" />Espacio privado</div><DropdownMenu><DropdownMenuTrigger asChild><button className="user-switch"><Avatar className="h-9 w-9"><AvatarFallback>{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p>{user?.name || "Mi perfil"}</p><small>Cuenta personal</small></div></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
      </Sidebar>
      <div className={`sidebar-resizer ${state === "collapsed" ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} />
    </div>
    <SidebarInset className="byscador-inset">{isMobile && <div className="mobile-bar"><SidebarTrigger /><span>{active?.label ?? "Byscador"}</span></div>}<main className="min-h-screen px-4 py-5 md:px-8 md:py-8">{children}</main></SidebarInset>
  </>;
}
