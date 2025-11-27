# 🚀 БЫСТРОЕ СОЗДАНИЕ ТЕСТОВОГО АДМИНИСТРАТОРА

## Способ 1: Через API (САМЫЙ ПРОСТОЙ!)

Откройте в браузере:
```
https://alchin-crm.vercel.app/api/crm/setup/force-create-admin
```

Это автоматически создаст или обновит тестового администратора с правильным хешем пароля!

## Способ 2: Через SQL в Supabase

1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте и выполните этот SQL:

```sql
-- Удаляем существующего пользователя (если есть)
DELETE FROM crm_users WHERE email = 'admin@test.kz';

-- Создаем тестового администратора
INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'admin@test.kz',
  'c34671b922295503ea644790945ed015936338c4a89e1dfcc58c00110b8eda5f',
  'Тестовый Администратор',
  (SELECT id FROM crm_roles WHERE name = 'admin' LIMIT 1),
  true;
```

**ВАЖНО:** Этот хеш работает только если в Vercel установлен `JWT_SECRET = 'your-secret-key-change-in-production'`

Если у вас другой JWT_SECRET, используйте Способ 1 (API endpoint).

## 📋 Данные для входа

После создания используйте:

- **Email:** `admin@test.kz`
- **Пароль:** `Admin123!`

## ✅ Проверка

После создания проверьте:

```sql
SELECT 
  u.email,
  u.full_name,
  r.name as role,
  u.is_active
FROM crm_users u
LEFT JOIN crm_roles r ON u.role_id = r.id
WHERE u.email = 'admin@test.kz';
```

## 🔧 Если не работает

1. Проверьте, что в Vercel установлен `JWT_SECRET`
2. Используйте API endpoint `/api/crm/setup/force-create-admin` - он автоматически использует правильный JWT_SECRET
3. Проверьте, что таблицы созданы: `SELECT * FROM crm_roles;`

