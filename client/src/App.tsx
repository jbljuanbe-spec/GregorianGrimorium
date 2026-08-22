import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Compare from "@/pages/Compare";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Offers from "@/pages/Offers";
import Profile from "@/pages/Profile";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import type { ComponentType } from "react";

const privatePage = (Page: ComponentType) => () => <DashboardLayout><Page /></DashboardLayout>;

function Router() {
  return <Switch><Route path="/" component={privatePage(Home)} /><Route path="/ofertas" component={privatePage(Offers)} /><Route path="/comparar" component={privatePage(Compare)} /><Route path="/perfil" component={privatePage(Profile)} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
