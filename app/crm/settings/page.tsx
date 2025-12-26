'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Bell, Database } from 'lucide-react';

export default function CRMSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Настройки</h1>
                <p className="text-gray-500">Управление параметрами системы</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-blue-600" />
                            <CardTitle>Общие настройки</CardTitle>
                        </div>
                        <CardDescription>Основные параметры CRM</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Настройки компании, валюты и часового пояса.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-green-600" />
                            <CardTitle>Безопасность</CardTitle>
                        </div>
                        <CardDescription>Настройки доступа и ролей</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Управление правами доступа и политиками безопасности.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-yellow-600" />
                            <CardTitle>Уведомления</CardTitle>
                        </div>
                        <CardDescription>Настройка оповещений</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Настройка Telegram-бота и системных уведомлений.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-purple-600" />
                            <CardTitle>Интеграции</CardTitle>
                        </div>
                        <CardDescription>Внешние сервисы</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Настройка Admiral API и других интеграций.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
