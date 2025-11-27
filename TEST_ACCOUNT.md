# 🧪 Тестовый аккаунт

## Быстрое создание тестового администратора

### Способ 1: Через API (рекомендуется)

После деплоя на Vercel выполните:

```bash
curl -X POST https://alchin-crm.vercel.app/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.kz",
    "password": "Admin123!",
    "fullName": "Тестовый Администратор"
  }'
```

Затем назначьте роль администратора через Supabase SQL:

```sql
UPDATE crm_users 
SET role_id = (SELECT id FROM crm_roles WHERE name = 'admin')
WHERE email = 'admin@test.kz';
```

### Способ 2: Через SQL скрипт

1. Откройте Supabase Dashboard → SQL Editor
2. Выполните скрипт из файла `scripts/create-test-admin-sql.sql`
3. После создания войдите через API для правильного хеширования пароля

### Способ 3: Через Node.js скрипт (локально)

```bash
# Установите зависимости (если еще не установлены)
npm install

# Установите tsx для запуска TypeScript
npm install -D tsx

# Создайте .env.local с настройками Supabase
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
echo "JWT_SECRET=your_secret" >> .env.local

# Запустите скрипт
npm run create-admin
```

## 📋 Данные тестового аккаунта

**Email:** `admin@test.kz`  
**Пароль:** `Admin123!`  
**Роль:** Администратор

**URL для входа:** https://alchin-crm.vercel.app/crm/login

## ⚠️ Важно

1. **Смените пароль** после первого входа
2. Это **тестовый аккаунт** - не используйте в продакшене
3. Для продакшена создайте отдельного администратора с безопасным паролем

## 🔍 Проверка создания

После создания проверьте пользователя:

```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM crm_users u
LEFT JOIN crm_roles r ON u.role_id = r.id
WHERE u.email = 'admin@test.kz';
```

## 🚀 Быстрый старт

1. Создайте тестового администратора (любым способом выше)
2. Откройте https://alchin-crm.vercel.app/crm/login
3. Войдите с данными:
   - Email: `admin@test.kz`
   - Пароль: `Admin123!`
4. Готово! Вы в системе 🎉

