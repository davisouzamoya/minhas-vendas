import { SidebarLayout } from "@/frontend/components/SidebarLayout";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
