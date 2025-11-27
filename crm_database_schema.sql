-- ============================================================
-- CRM СИСТЕМА - СХЕМА БАЗЫ ДАННЫХ
-- Для бизнеса: видеонаблюдение, монтаж, GPS-мониторинг
-- ============================================================

-- 1. РОЛИ И ПОЛЬЗОВАТЕЛИ
-- ============================================================

-- Таблица ролей
CREATE TABLE IF NOT EXISTS crm_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS crm_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    telegram_id VARCHAR(100),
    role_id UUID REFERENCES crm_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сессий (JWT токены)
CREATE TABLE IF NOT EXISTS crm_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. КЛИЕНТЫ
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    company_name VARCHAR(255),
    bin_iin VARCHAR(20),
    notes TEXT,
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. СДЕЛКИ (ПРОДАЖИ)
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES crm_clients(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiation', 'agreement', 'in_progress', 'completed', 'cancelled')),
    total_amount DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2) DEFAULT 0, -- себестоимость
    expenses DECIMAL(15,2) DEFAULT 0, -- расходы
    profit DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - cost_price - expenses) STORED,
    manager_bonus_percent DECIMAL(5,2) DEFAULT 0, -- процент бонуса менеджера
    manager_bonus_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount * manager_bonus_percent / 100) STORED,
    sale_date DATE,
    completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Элементы сделки (услуги/товары)
CREATE TABLE IF NOT EXISTS crm_deal_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('service', 'product')),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Документы сделки
CREATE TABLE IF NOT EXISTS crm_deal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к сделкам
CREATE TABLE IF NOT EXISTS crm_deal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ЗАДАЧИ (TASKS)
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'on_approval', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    service_type VARCHAR(100), -- видеонаблюдение, пожарка, турникеты, GPS
    address TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    client_signature TEXT, -- base64 подпись клиента
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Файлы задач (фото/видео выполненных работ)
CREATE TABLE IF NOT EXISTS crm_task_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES crm_tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к задачам
CREATE TABLE IF NOT EXISTS crm_task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES crm_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- История изменений задач
CREATE TABLE IF NOT EXISTS crm_task_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES crm_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GPS УСТРОЙСТВА
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_gps_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country VARCHAR(100) DEFAULT 'KZ',
    city VARCHAR(100),
    vehicle_number VARCHAR(50) NOT NULL,
    login VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_email VARCHAR(255),
    imei VARCHAR(50) UNIQUE,
    sim_number VARCHAR(50),
    object_name VARCHAR(255), -- привязка к объекту
    admiral_device_id VARCHAR(100), -- ID устройства в Admiral API
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- История активаций GPS
CREATE TABLE IF NOT EXISTS crm_gps_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES crm_gps_devices(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Журнал действий GPS (команды через Admiral API)
CREATE TABLE IF NOT EXISTS crm_gps_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES crm_gps_devices(id) ON DELETE CASCADE,
    command_type VARCHAR(100) NOT NULL,
    command_data JSONB,
    admiral_response JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'success', 'failed')),
    sent_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ФИНАНСЫ
-- ============================================================

-- Доходы
CREATE TABLE IF NOT EXISTS crm_finance_income (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KZT',
    description TEXT,
    income_date DATE NOT NULL,
    payment_method VARCHAR(50), -- cash, bank, card
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Расходы
CREATE TABLE IF NOT EXISTS crm_finance_expense (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES crm_tasks(id) ON DELETE SET NULL,
    category VARCHAR(100), -- материалы, зарплата, транспорт, прочее
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KZT',
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50),
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Выплаты монтажникам
CREATE TABLE IF NOT EXISTS crm_finance_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES crm_tasks(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KZT',
    payment_type VARCHAR(50) CHECK (payment_type IN ('salary', 'bonus', 'advance')),
    payment_date DATE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Бонусы менеджерам
CREATE TABLE IF NOT EXISTS crm_finance_bonuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KZT',
    bonus_date DATE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. СОТРУДНИКИ
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
    position VARCHAR(255),
    hire_date DATE,
    dismiss_date DATE,
    work_schedule VARCHAR(100), -- полный день, сменный график
    salary DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'dismissed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. НАСТРОЙКИ
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ЛОГИ И УВЕДОМЛЕНИЯ
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- deal, task, client, etc.
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- task_assigned, deal_updated, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================================

-- Пользователи
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);
CREATE INDEX IF NOT EXISTS idx_crm_users_role_id ON crm_users(role_id);
CREATE INDEX IF NOT EXISTS idx_crm_users_active ON crm_users(is_active);

-- Сессии
CREATE INDEX IF NOT EXISTS idx_crm_sessions_user_id ON crm_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_sessions_token_hash ON crm_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_crm_sessions_expires_at ON crm_sessions(expires_at);

-- Клиенты
CREATE INDEX IF NOT EXISTS idx_crm_clients_phone ON crm_clients(phone);
CREATE INDEX IF NOT EXISTS idx_crm_clients_email ON crm_clients(email);

-- Сделки
CREATE INDEX IF NOT EXISTS idx_crm_deals_client_id ON crm_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_manager_id ON crm_deals(manager_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals(status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_sale_date ON crm_deals(sale_date);

-- Задачи
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal_id ON crm_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_scheduled_start ON crm_tasks(scheduled_start);

-- GPS
CREATE INDEX IF NOT EXISTS idx_crm_gps_devices_imei ON crm_gps_devices(imei);
CREATE INDEX IF NOT EXISTS idx_crm_gps_devices_vehicle_number ON crm_gps_devices(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_crm_gps_devices_active ON crm_gps_devices(is_active);

-- Финансы
CREATE INDEX IF NOT EXISTS idx_crm_finance_income_date ON crm_finance_income(income_date);
CREATE INDEX IF NOT EXISTS idx_crm_finance_expense_date ON crm_finance_expense(expense_date);
CREATE INDEX IF NOT EXISTS idx_crm_finance_income_deal_id ON crm_finance_income(deal_id);

-- Уведомления
CREATE INDEX IF NOT EXISTS idx_crm_notifications_user_id ON crm_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_read ON crm_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_created_at ON crm_notifications(created_at);

-- ============================================================
-- ТРИГГЕРЫ ДЛЯ ОБНОВЛЕНИЯ updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION crm_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_users_updated_at BEFORE UPDATE ON crm_users
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_roles_updated_at BEFORE UPDATE ON crm_roles
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_clients_updated_at BEFORE UPDATE ON crm_clients
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_deals_updated_at BEFORE UPDATE ON crm_deals
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_gps_devices_updated_at BEFORE UPDATE ON crm_gps_devices
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_settings_updated_at BEFORE UPDATE ON crm_settings
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_employees_updated_at BEFORE UPDATE ON crm_employees
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

CREATE TRIGGER crm_gps_commands_updated_at BEFORE UPDATE ON crm_gps_commands
    FOR EACH ROW EXECUTE FUNCTION crm_update_updated_at();

-- ============================================================
-- ВСТАВКА БАЗОВЫХ ДАННЫХ
-- ============================================================

-- Роли
INSERT INTO crm_roles (name, description, permissions) VALUES
    ('admin', 'Администратор - полный доступ', '{"all": true}'),
    ('manager', 'Менеджер продаж', '{"deals": true, "tasks": {"create": true, "view": true}, "clients": true}'),
    ('installer', 'Монтажник', '{"tasks": {"view": true, "update": true}, "files": {"upload": true}}')
ON CONFLICT (name) DO NOTHING;

-- Настройки по умолчанию
INSERT INTO crm_settings (key, value, description) VALUES
    ('manager_bonus_percent', '{"default": 5}', 'Процент бонуса менеджера по умолчанию'),
    ('admiral_api_key', '{"key": ""}', 'API ключ для Admiral GPS'),
    ('admiral_api_url', '{"url": "https://api.admiral.com"}', 'URL API Admiral'),
    ('tax_rate', '{"rate": 12}', 'Ставка налога (%)'),
    ('currency', '{"default": "KZT"}', 'Валюта по умолчанию')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Включаем RLS для всех таблиц
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_finance_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_finance_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notifications ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (базовые - можно расширить)
-- Админ видит всё
CREATE POLICY "Admin full access" ON crm_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM crm_users u JOIN crm_roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.name = 'admin')
    );

-- Менеджер видит свои сделки и задачи
CREATE POLICY "Manager own deals" ON crm_deals
    FOR ALL USING (
        manager_id = auth.uid() OR
        EXISTS (SELECT 1 FROM crm_users u JOIN crm_roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.name = 'admin')
    );

-- Монтажник видит назначенные ему задачи
CREATE POLICY "Installer own tasks" ON crm_tasks
    FOR ALL USING (
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM crm_users u JOIN crm_roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.name IN ('admin', 'manager'))
    );

-- Уведомления видны только владельцу
CREATE POLICY "User own notifications" ON crm_notifications
    FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- КОММЕНТАРИИ
-- ============================================================

COMMENT ON TABLE crm_users IS 'Пользователи CRM системы';
COMMENT ON TABLE crm_roles IS 'Роли пользователей';
COMMENT ON TABLE crm_deals IS 'Сделки/продажи';
COMMENT ON TABLE crm_tasks IS 'Задачи для монтажников';
COMMENT ON TABLE crm_gps_devices IS 'GPS устройства';
COMMENT ON TABLE crm_finance_income IS 'Доходы';
COMMENT ON TABLE crm_finance_expense IS 'Расходы';

