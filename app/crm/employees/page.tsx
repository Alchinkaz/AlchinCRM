'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, UserPlus, Edit2, UserX, UserCheck } from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function CRMEmployeesPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
            let url = '/api/crm/users?includeInactive=true';
            if (roleFilter !== 'all') {
                url += `&role=${roleFilter}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleActive = async (user: any) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
            const response = await fetch(`/api/crm/users?id=${user.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: !user.is_active }),
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Сотрудники</h1>
                    <p className="text-gray-500">Управление персоналом и ролями</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingUser(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Добавить сотрудника
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? 'Измените данные сотрудника' : 'Заполните данные для нового сотрудника'}
                            </DialogDescription>
                        </DialogHeader>
                        <EmployeeForm
                            initialData={editingUser}
                            onSuccess={() => { setDialogOpen(false); fetchUsers(); }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Фильтры */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Поиск по имени, email или телефону..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Роль" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все роли</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="installer">Монтажник</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Список сотрудников */}
            {loading ? (
                <div className="text-center py-12">Загрузка...</div>
            ) : filteredUsers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        Сотрудники не найдены
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ФИО</TableHead>
                                <TableHead>Email / Телефон</TableHead>
                                <TableHead>Роль</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{user.email}</div>
                                        <div className="text-xs text-gray-500">{user.phone || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.crm_roles?.name || 'Нет роли'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_active ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">Активен</Badge>
                                        ) : (
                                            <Badge variant="secondary">Неактивен</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingUser(user); setDialogOpen(true); }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={user.is_active ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-green-500 hover:text-green-600 hover:bg-green-50"}
                                                onClick={() => handleToggleActive(user)}
                                            >
                                                {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}

function EmployeeForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        email: initialData?.email || '',
        password: '',
        full_name: initialData?.full_name || '',
        role_id: initialData?.role_id || '',
        phone: initialData?.phone || '',
        telegram_id: initialData?.telegram_id || '',
    });
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/crm/roles')
            .then(res => res.json())
            .then(data => setRoles(data.roles || []))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : 'test-token';
            const url = initialData
                ? `/api/crm/users?id=${initialData.id}`
                : '/api/crm/users';
            const method = initialData ? 'PATCH' : 'POST';

            const body: any = { ...formData };
            if (initialData && !body.password) {
                delete body.password; // Не обновлять пароль если пусто
            }

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                onSuccess();
            } else {
                const err = await response.json();
                alert(err.error || 'Ошибка при сохранении');
            }
        } catch (error: any) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name">ФИО *</Label>
                    <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!initialData}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="password">{initialData ? 'Новый пароль (оставьте пустым чтобы не менять)' : 'Пароль *'}</Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!initialData}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Роль *</Label>
                    <Select
                        value={formData.role_id}
                        onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.description || role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="telegram_id">Telegram ID</Label>
                    <Input
                        id="telegram_id"
                        value={formData.telegram_id}
                        onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                        placeholder="@username"
                    />
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Сохранение...' : (initialData ? 'Обновить данные' : 'Создать сотрудника')}
            </Button>
        </form>
    );
}
