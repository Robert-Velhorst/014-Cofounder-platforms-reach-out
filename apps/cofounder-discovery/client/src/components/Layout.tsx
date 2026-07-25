import Navigation from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      <Navigation />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
