# Создание первого администратора

## Способ 1: Через API (рекомендуется)

После запуска сервера выполните:

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alchin.kz",
    "password": "Admin123!",
    "fullName": "Администратор"
  }'
```

Или используйте любой HTTP клиент (Postman, Insomnia, etc.)

**Важно:** После регистрации нужно вручную назначить роль администратора через SQL:

```sql
-- Получите ID пользователя
SELECT id, email FROM crm_users WHERE email = 'admin@alchin.kz';

-- Назначьте роль администратора (замените USER_ID)
UPDATE crm_users 
SET role_id = (SELECT id FROM crm_roles WHERE name = 'admin')
WHERE id = 'USER_ID';
```

## Способ 2: Через SQL напрямую

1. Откройте Supabase Dashboard → SQL Editor

2. Выполните следующий SQL (замените пароль на свой):

```sql
-- Получите ID роли администратора
SELECT id FROM crm_roles WHERE name = 'admin';

-- Создайте пользователя
-- Пароль будет захеширован при первом входе через API
-- Для прямого создания через SQL нужно захешировать пароль

-- Временный пароль (будет изменен при первом входе)
INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)
VALUES (
  'admin@alchin.kz',
  'temp_hash_will_be_updated', -- Временный хеш
  'Администратор',
  (SELECT id FROM crm_roles WHERE name = 'admin'),
  true
);
```

3. После создания пользователя, войдите через API и пароль будет правильно захеширован.

## Способ 3: Использовать скрипт

```bash
node scripts/create-admin.js admin@alchin.kz Admin123! "Администратор"
```

Скрипт выведет SQL запрос, который нужно выполнить в Supabase.

## Дефолтные учетные данные (после создания)

**Email:** `admin@alchin.kz`  
**Пароль:** `Admin123!` (или тот, который вы указали)

**⚠️ ВАЖНО:** После первого входа обязательно смените пароль!

## Проверка создания пользователя

```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM crm_users u
LEFT JOIN crm_roles r ON u.role_id = r.id
WHERE u.email = 'admin@alchin.kz';
```

## Создание других пользователей

### Менеджер продаж

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@alchin.kz",
    "password": "Manager123!",
    "fullName": "Иван Менеджеров",
    "roleId": "UUID_РОЛИ_MANAGER"
  }'
```

### Монтажник

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "installer@alchin.kz",
    "password": "Installer123!",
    "fullName": "Петр Монтажников",
    "roleId": "UUID_РОЛИ_INSTALLER"
  }'
```

**Где взять UUID ролей?**

```sql
SELECT id, name FROM crm_roles;
```

