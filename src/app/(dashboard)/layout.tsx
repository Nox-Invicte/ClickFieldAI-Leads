import { AuthProvider } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 min-h-screen bg-gray-50">
        <div className="p-6">{children}</div>
      </main>
    </AuthProvider>
  );
}
