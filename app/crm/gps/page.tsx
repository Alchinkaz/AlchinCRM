'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Send, MapPin } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CRMGPSPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/crm/gps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Ошибка загрузки устройств:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device =>
    device.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.owner_phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendCommand = (device: any) => {
    setSelectedDevice(device);
    setCommandDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">GPS Устройства</h1>
          <p className="text-gray-500">Управление GPS-мониторингом через Admiral API</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить устройство
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить GPS устройство</DialogTitle>
              <DialogDescription>
                Заполните информацию об устройстве
              </DialogDescription>
            </DialogHeader>
            <GPSDeviceForm onSuccess={() => { setDialogOpen(false); fetchDevices(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск по номеру машины, IMEI или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Таблица устройств */}
      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Устройства не найдены
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Страна</TableHead>
                    <TableHead>Город</TableHead>
                    <TableHead>Номер машины</TableHead>
                    <TableHead>Логин</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>SIM номер</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>{device.country || 'KZ'}</TableCell>
                      <TableCell>{device.city || '-'}</TableCell>
                      <TableCell className="font-medium">{device.vehicle_number}</TableCell>
                      <TableCell>{device.login || '-'}</TableCell>
                      <TableCell>{device.owner_phone || '-'}</TableCell>
                      <TableCell>{device.owner_email || '-'}</TableCell>
                      <TableCell>{device.imei || '-'}</TableCell>
                      <TableCell>{device.sim_number || '-'}</TableCell>
                      <TableCell>{device.object_name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={device.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {device.is_active ? 'Активно' : 'Неактивно'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendCommand(device)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Команда
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог отправки команды */}
      <Dialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить команду</DialogTitle>
            <DialogDescription>
              Устройство: {selectedDevice?.vehicle_number}
            </DialogDescription>
          </DialogHeader>
          <GPSCommandForm
            deviceId={selectedDevice?.id}
            onSuccess={() => {
              setCommandDialogOpen(false);
              setSelectedDevice(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GPSDeviceForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    country: 'KZ',
    city: '',
    vehicle_number: '',
    login: '',
    owner_phone: '',
    owner_email: '',
    imei: '',
    sim_number: '',
    object_name: '',
    admiral_device_id: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/crm/gps', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Ошибка создания устройства:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Страна *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicle_number">Номер машины *</Label>
        <Input
          id="vehicle_number"
          value={formData.vehicle_number}
          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="login">Логин</Label>
          <Input
            id="login"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_phone">Телефон владельца</Label>
          <Input
            id="owner_phone"
            type="tel"
            value={formData.owner_phone}
            onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner_email">Email владельца</Label>
        <Input
          id="owner_email"
          type="email"
          value={formData.owner_email}
          onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI</Label>
          <Input
            id="imei"
            value={formData.imei}
            onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sim_number">SIM номер</Label>
          <Input
            id="sim_number"
            value={formData.sim_number}
            onChange={(e) => setFormData({ ...formData, sim_number: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="object_name">Привязка к объекту</Label>
        <Input
          id="object_name"
          value={formData.object_name}
          onChange={(e) => setFormData({ ...formData, object_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admiral_device_id">Admiral Device ID</Label>
        <Input
          id="admiral_device_id"
          value={formData.admiral_device_id}
          onChange={(e) => setFormData({ ...formData, admiral_device_id: e.target.value })}
          placeholder="ID устройства в Admiral API"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Создание...' : 'Создать устройство'}
      </Button>
    </form>
  );
}

function GPSCommandForm({ deviceId, onSuccess }: { deviceId?: string; onSuccess: () => void }) {
  const [commandType, setCommandType] = useState('');
  const [commandData, setCommandData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId || !commandType) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch(`/api/crm/gps/${deviceId}/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command_type: commandType,
          command_data: commandData ? JSON.parse(commandData) : {},
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Команда отправлена успешно!');
        onSuccess();
      } else {
        alert('Ошибка отправки команды: ' + data.error);
      }
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="command_type">Тип команды *</Label>
        <Select value={commandType} onValueChange={setCommandType}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип команды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="get_location">Получить местоположение</SelectItem>
            <SelectItem value="get_status">Получить статус</SelectItem>
            <SelectItem value="reboot">Перезагрузка</SelectItem>
            <SelectItem value="update_config">Обновить конфигурацию</SelectItem>
            <SelectItem value="custom">Пользовательская команда</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="command_data">Данные команды (JSON)</Label>
        <textarea
          id="command_data"
          className="w-full min-h-[100px] px-3 py-2 border rounded-md font-mono text-sm"
          value={commandData}
          onChange={(e) => setCommandData(e.target.value)}
          placeholder='{"key": "value"}'
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !commandType}>
        {loading ? 'Отправка...' : 'Отправить команду'}
      </Button>
    </form>
  );
}

