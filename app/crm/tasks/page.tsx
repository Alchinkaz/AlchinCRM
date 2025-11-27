'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Camera, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

export default function CRMTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isInstaller, setIsInstaller] = useState(false);

  useEffect(() => {
    // Получаем пользователя только на клиенте
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsInstaller(parsedUser.crm_roles?.name === 'installer');
      } else {
        // Моковый пользователь для тестового режима
        const mockUser = {
          id: 'test-user-id',
          email: 'admin@test.kz',
          full_name: 'Тестовый Администратор',
          crm_roles: { name: 'admin' },
        };
        setUser(mockUser);
        setIsInstaller(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [statusFilter, user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
      let url = '/api/crm/tasks';
      
      if (isInstaller && user.id) {
        url += `?assigned_to=${user.id}`;
      } else if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    on_approval: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    on_approval: 'На согласовании',
    completed: 'Завершена',
    cancelled: 'Отменена',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочный',
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
      const response = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-gray-500">
            {isInstaller ? 'Мои задачи' : 'Управление задачами монтажников'}
          </p>
        </div>
        {!isInstaller && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новая задача
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать задачу</DialogTitle>
                <DialogDescription>
                  Назначьте задачу монтажнику
                </DialogDescription>
              </DialogHeader>
              <TaskForm onSuccess={() => { setDialogOpen(false); fetchTasks(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск задач..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {!isInstaller && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="on_approval">На согласовании</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Список задач */}
      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Задачи не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={statusColors[task.status] || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                    {task.priority && (
                      <Badge className={priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}>
                        {priorityLabels[task.priority] || task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {task.service_type && (
                      <div>
                        <span className="text-gray-500">Тип услуги: </span>
                        <span className="font-medium">{task.service_type}</span>
                      </div>
                    )}
                    {task.address && (
                      <div>
                        <span className="text-gray-500">Адрес: </span>
                        <span>{task.address}</span>
                      </div>
                    )}
                    {task.scheduled_start && (
                      <div>
                        <span className="text-gray-500">Запланировано: </span>
                        <span>{new Date(task.scheduled_start).toLocaleString('ru-RU')}</span>
                      </div>
                    )}
                  </div>

                  {isInstaller && task.status !== 'completed' && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {task.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Начать работу
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(task.id, 'on_approval')}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            На согласование
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Завершить
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Загрузить фото
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог загрузки фото */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Загрузить фото/видео</DialogTitle>
              <DialogDescription>
                Загрузите фотографии выполненных работ для задачи: {selectedTask.title}
              </DialogDescription>
            </DialogHeader>
            <TaskFileUpload taskId={selectedTask.id} onSuccess={() => { setSelectedTask(null); fetchTasks(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'new',
    priority: 'medium',
    service_type: '',
    address: '',
    scheduled_start: '',
    scheduled_end: '',
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Загрузить список монтажников
    fetch('/api/crm/users?role=installer')
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduled_start: formData.scheduled_start || null,
          scheduled_end: formData.scheduled_end || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Название задачи *</Label>
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
          <Label htmlFor="assigned_to">Монтажник *</Label>
          <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите монтажника" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_type">Тип услуги</Label>
          <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="videonablyudenie">Видеонаблюдение</SelectItem>
              <SelectItem value="pozharka">Пожарка</SelectItem>
              <SelectItem value="turnikety">Турникеты</SelectItem>
              <SelectItem value="gps">GPS-мониторинг</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Приоритет</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="urgent">Срочный</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Адрес</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_start">Начало работы</Label>
          <Input
            id="scheduled_start"
            type="datetime-local"
            value={formData.scheduled_start}
            onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_end">Окончание работы</Label>
          <Input
            id="scheduled_end"
            type="datetime-local"
            value={formData.scheduled_end}
            onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Создание...' : 'Создать задачу'}
      </Button>
    </form>
  );
}

function TaskFileUpload({ taskId, onSuccess }: { taskId: string; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task_id', taskId);

      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
      const response = await fetch('/api/crm/tasks/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Выберите файл</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !file}>
        {loading ? 'Загрузка...' : 'Загрузить'}
      </Button>
    </form>
  );
}

