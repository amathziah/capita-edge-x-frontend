import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header sidebarOpen={false} setSidebarOpen={() => { }} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}