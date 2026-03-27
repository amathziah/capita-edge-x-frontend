import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { RefreshingIndicator } from '../ui/RefreshingIndicator';

export function Layout() {
  const location = useLocation();
  const isAIActive = location.pathname === '/dashboard/ai';

  return (
    <div className="flex h-screen bg-background">
      <RefreshingIndicator />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header sidebarOpen={false} setSidebarOpen={() => { }} />

        <main className={`flex-1 overflow-x-hidden ${isAIActive ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
          <div className={`mx-auto w-full ${isAIActive ? 'h-full p-0' : 'p-4 lg:p-8 max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}