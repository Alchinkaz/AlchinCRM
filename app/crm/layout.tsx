'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ClipboardList, 
  MapPin, 
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Не проверяем авторизацию на странице логина
    if (pathname === '/crm/login') {
      return;
    }

    // Тестовый режим: создаем мокового пользователя без проверки
    const mockUser = {
      id: 'test-user-id',
      email: 'admin@test.kz',
      full_name: 'Тестовый Администратор',
      crm_roles: {
        id: 'admin-role-id',
        name: 'admin',
        description: 'Администратор - полный доступ',
      },
    };

    setUser(mockUser);
    
    // Сохраняем в localStorage для совместимости
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_user', JSON.stringify(mockUser));
      localStorage.setItem('crm_token', 'test-token-no-auth');
    }
  }, [router, pathname]);

  const handleLogout = () => {
    // В тестовом режиме просто перезагружаем страницу
    if (typeof window !== 'undefined') {
      window.location.href = '/crm/login';
    }
  };

  // Не показываем layout на странице логина
  if (pathname === '/crm/login') {
    return <>{children}</>;
  }

  // В тестовом режиме всегда показываем интерфейс
  if (!user) {
    // Создаем мокового пользователя
    const mockUser = {
      id: 'test-user-id',
      email: 'admin@test.kz',
      full_name: 'Тестовый Администратор',
      crm_roles: {
        id: 'admin-role-id',
        name: 'admin',
      },
    };
    setUser(mockUser);
    return null;
  }

  const role = user.crm_roles?.name || 'installer';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isInstaller = role === 'installer';

  const menuItems = [
    { href: '/crm/dashboard', label: 'Дашборд', icon: LayoutDashboard, show: true },
    { href: '/crm/deals', label: 'Продажи', icon: ShoppingCart, show: isAdmin || isManager },
    { href: '/crm/tasks', label: 'Задачи', icon: ClipboardList, show: true },
    { href: '/crm/gps', label: 'GPS устройства', icon: MapPin, show: isAdmin },
    { href: '/crm/finance', label: 'Финансы', icon: DollarSign, show: isAdmin },
    { href: '/crm/employees', label: 'Сотрудники', icon: Users, show: isAdmin },
    { href: '/crm/settings', label: 'Настройки', icon: Settings, show: isAdmin },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильная навигация */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">CRM</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Боковая панель */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:sticky
            top-0 left-0
            h-screen
            w-64 bg-white border-r
            transition-transform duration-300
            z-40
            overflow-y-auto
          `}
        >
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold">CRM Система</h2>
              <p className="text-sm text-gray-500">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg
                      transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Выйти
              </Button>
            </div>
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-4 lg:p-6">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

