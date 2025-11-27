'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CRMFinancePage() {
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
      const response = await fetch('/api/crm/finance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFinance(data);
    } catch (error) {
      console.error('Ошибка загрузки финансов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-gray-500">Управление доходами и расходами</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доходы (месяц)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {finance?.income?.total?.toLocaleString('ru-RU') || 0} ₸
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
              {finance?.expenses?.total?.toLocaleString('ru-RU') || 0} ₸
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
              {finance?.profit?.toLocaleString('ru-RU') || 0} ₸
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детали */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income">Доходы</TabsTrigger>
          <TabsTrigger value="expenses">Расходы</TabsTrigger>
          <TabsTrigger value="payments">Выплаты</TabsTrigger>
          <TabsTrigger value="bonuses">Бонусы</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Доходы</CardTitle>
            </CardHeader>
            <CardContent>
              {finance?.income_list?.length > 0 ? (
                <div className="space-y-2">
                  {finance.income_list.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.description || 'Доход'}</p>
                        <p className="text-sm text-gray-500">
                          {item.income_date ? new Date(item.income_date).toLocaleDateString('ru-RU') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          +{item.amount?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Нет данных о доходах</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Расходы</CardTitle>
            </CardHeader>
            <CardContent>
              {finance?.expenses_list?.length > 0 ? (
                <div className="space-y-2">
                  {finance.expenses_list.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.description || 'Расход'}</p>
                        <p className="text-sm text-gray-500">
                          {item.category && <span className="mr-2">{item.category}</span>}
                          {item.expense_date ? new Date(item.expense_date).toLocaleDateString('ru-RU') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          -{item.amount?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Нет данных о расходах</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Выплаты монтажникам</CardTitle>
            </CardHeader>
            <CardContent>
              {finance?.payments_list?.length > 0 ? (
                <div className="space-y-2">
                  {finance.payments_list.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.user_name || 'Монтажник'}</p>
                        <p className="text-sm text-gray-500">
                          {item.payment_type} | {item.payment_date ? new Date(item.payment_date).toLocaleDateString('ru-RU') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {item.amount?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Нет данных о выплатах</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Бонусы менеджерам</CardTitle>
            </CardHeader>
            <CardContent>
              {finance?.bonuses_list?.length > 0 ? (
                <div className="space-y-2">
                  {finance.bonuses_list.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.user_name || 'Менеджер'}</p>
                        <p className="text-sm text-gray-500">
                          {item.bonus_date ? new Date(item.bonus_date).toLocaleDateString('ru-RU') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          {item.amount?.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Нет данных о бонусах</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

