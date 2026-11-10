import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { CalendarDays, LogOut, Users } from "lucide-react";

import { Marca } from "@/components/Marca";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/recepcao")({
  component: RecepcaoLayout,
});

const itens = [
  { titulo: "Clientes", to: "/recepcao/clientes", icon: Users },
  { titulo: "Agendamento", to: "/recepcao/agendamento", icon: CalendarDays },
] as const;

function RecepcaoLayout() {
  const { pathname } = useLocation();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-5 pb-6 pt-7">
          <Marca className="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-[0.3em] text-sidebar-primary/80">
              Recepção
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itens.map((item) => {
                  const ativo = pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={ativo}
                        size="lg"
                        className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-sidebar-foreground/70">
                <Link to="/">
                  <LogOut />
                  <span>Sair</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-display text-xl">Dúctil</span>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
