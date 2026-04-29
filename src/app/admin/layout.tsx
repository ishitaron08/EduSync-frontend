export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-mode min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">{children}</div>;
}
