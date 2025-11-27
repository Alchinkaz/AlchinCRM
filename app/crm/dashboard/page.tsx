'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  ClipboardList,
  Users
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CRMDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/crm/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
  const role = user.crm_roles?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-gray-500">Обзор вашей деятельности</p>
      </div>

      {role === 'admin' && dashboard && (
        <>
          {/* Карточки статистики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Доходы (месяц)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.income?.total?.toLocaleString('ru-RU') || 0} ₸
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Расходы (месяц)</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.expenses?.total?.toLocaleString('ru-RU') || 0} ₸
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.profit?.total?.toLocaleString('ru-RU') || 0} ₸
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Продаж (месяц)</CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.deals_count || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* KPI менеджеров */}
          {dashboard.manager_kpis && dashboard.manager_kpis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>KPI Менеджеров</CardTitle>
                <CardDescription>Показатели эффективности менеджеров</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.manager_kpis.map((kpi: any) => (
                    <div key={kpi.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{kpi.name}</p>
                        <p className="text-sm text-gray-500">
                          Сделок: {kpi.deals_count} | Продаж: {kpi.total_sales?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          Бонус: {kpi.total_bonus?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Активные задачи */}
          <Card>
            <CardHeader>
              <CardTitle>Активные задачи</CardTitle>
              <CardDescription>Задач в работе: {dashboard.active_tasks_count || 0}</CardDescription>
            </CardHeader>
          </Card>
        </>
      )}

      {role === 'manager' && dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Всего сделок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.deals_count || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Общая сумма продаж</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboard.total_sales?.toLocaleString('ru-RU') || 0} ₸
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Бонусы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboard.total_bonus?.toLocaleString('ru-RU') || 0} ₸
                </div>
              </CardContent>
            </Card>
          </div>

          {dashboard.deals_by_status && (
            <Card>
              <CardHeader>
                <CardTitle>Сделки по статусам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold">{dashboard.deals_by_status.new}</div>
                    <div className="text-sm text-gray-500">Новые</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold">{dashboard.deals_by_status.in_progress}</div>
                    <div className="text-sm text-gray-500">В работе</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold">{dashboard.deals_by_status.completed}</div>
                    <div className="text-sm text-gray-500">Завершены</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {role === 'installer' && dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Всего задач</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.tasks_count || 0}</div>
              </CardContent>
            </Card>

            {dashboard.tasks_by_status && (
              <Card>
                <CardHeader>
                  <CardTitle>Задачи по статусам</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Новые:</span>
                      <span className="font-bold">{dashboard.tasks_by_status.new}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>В работе:</span>
                      <span className="font-bold">{dashboard.tasks_by_status.in_progress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Завершены:</span>
                      <span className="font-bold">{dashboard.tasks_by_status.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {dashboard.upcoming_tasks && dashboard.upcoming_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ближайшие задачи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.upcoming_tasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {task.scheduled_start 
                          ? new Date(task.scheduled_start).toLocaleDateString('ru-RU')
                          : 'Дата не указана'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

