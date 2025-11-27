'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CRMDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const url = statusFilter !== 'all' 
        ? `/api/crm/deals?status=${statusFilter}`
        : '/api/crm/deals';
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal =>
    deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    negotiation: 'bg-orange-100 text-orange-800',
    agreement: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новая',
    contacted: 'Связались',
    negotiation: 'Переговоры',
    agreement: 'Согласование',
    in_progress: 'В работе',
    completed: 'Завершена',
    cancelled: 'Отменена',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Продажи</h1>
          <p className="text-gray-500">Управление сделками и продажами</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Новая сделка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать сделку</DialogTitle>
              <DialogDescription>
                Заполните информацию о новой сделке
              </DialogDescription>
            </DialogHeader>
            <DealForm onSuccess={() => { setDialogOpen(false); fetchDeals(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новая</SelectItem>
            <SelectItem value="contacted">Связались</SelectItem>
            <SelectItem value="negotiation">Переговоры</SelectItem>
            <SelectItem value="agreement">Согласование</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="completed">Завершена</SelectItem>
            <SelectItem value="cancelled">Отменена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список сделок */}
      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Сделки не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg">{deal.title}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[deal.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[deal.status] || deal.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deal.description && (
                    <p className="text-sm text-gray-600">{deal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Сумма: </span>
                      <span className="font-bold">{deal.total_amount?.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    {deal.profit && (
                      <div>
                        <span className="text-gray-500">Прибыль: </span>
                        <span className="font-bold text-green-600">{deal.profit.toLocaleString('ru-RU')} ₸</span>
                      </div>
                    )}
                    {deal.manager_bonus_amount && (
                      <div>
                        <span className="text-gray-500">Бонус: </span>
                        <span className="font-bold text-blue-600">{deal.manager_bonus_amount.toLocaleString('ru-RU')} ₸</span>
                      </div>
                    )}
                    {deal.sale_date && (
                      <div>
                        <span className="text-gray-500">Дата: </span>
                        <span>{new Date(deal.sale_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DealForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'new',
    total_amount: '',
    cost_price: '',
    expenses: '',
    manager_bonus_percent: '5',
    sale_date: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          total_amount: parseFloat(formData.total_amount) || 0,
          cost_price: parseFloat(formData.cost_price) || 0,
          expenses: parseFloat(formData.expenses) || 0,
          manager_bonus_percent: parseFloat(formData.manager_bonus_percent) || 0,
          sale_date: formData.sale_date || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Ошибка создания сделки:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Название сделки *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <textarea
          id="description"
          className="w-full min-h-[100px] px-3 py-2 border rounded-md"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_amount">Сумма сделки *</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            value={formData.total_amount}
            onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost_price">Себестоимость</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expenses">Расходы</Label>
          <Input
            id="expenses"
            type="number"
            step="0.01"
            value={formData.expenses}
            onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager_bonus_percent">Бонус менеджера (%)</Label>
          <Input
            id="manager_bonus_percent"
            type="number"
            step="0.01"
            value={formData.manager_bonus_percent}
            onChange={(e) => setFormData({ ...formData, manager_bonus_percent: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="contacted">Связались</SelectItem>
              <SelectItem value="negotiation">Переговоры</SelectItem>
              <SelectItem value="agreement">Согласование</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale_date">Дата продажи</Label>
          <Input
            id="sale_date"
            type="date"
            value={formData.sale_date}
            onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Создание...' : 'Создать сделку'}
      </Button>
    </form>
  );
}

