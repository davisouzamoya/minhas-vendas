import { SidebarLayout } from "@/app/(frontend)/components/SidebarLayout";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
