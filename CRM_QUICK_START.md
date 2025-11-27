# 🚀 CRM Система - Быстрый старт

## ⚡ Установка за 5 минут

### 1. Установите зависимости

```bash
npm install
# или
pnpm install
```

### 2. Настройте переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_random_secret_key_min_32_chars
ADMIRAL_API_KEY=your_admiral_api_key
ADMIRAL_API_URL=https://api.admiral.com
```

### 3. Создайте базу данных

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Откройте файл `crm_database_schema.sql`
5. Скопируйте весь код и выполните в SQL Editor
6. Убедитесь, что все таблицы созданы успешно

### 4. Создайте первого администратора

Выполните в SQL Editor:

```sql
-- Получите ID роли администратора
SELECT id FROM crm_roles WHERE name = 'admin';

-- Создайте пользователя (замените email и пароль)
-- Пароль будет захеширован при первом входе через API
-- Для теста можно использовать простой пароль, но в продакшене используйте сложный

-- ВАЖНО: Для создания пользователя используйте API регистрации:
-- POST /api/crm/auth/register
-- {
--   "email": "admin@example.com",
--   "password": "your_secure_password",
--   "fullName": "Администратор",
--   "roleId": "uuid_роли_админа"
-- }
```

**Или создайте через API после запуска сервера:**

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "fullName": "Администратор"
  }'
```

### 5. Запустите проект

```bash
npm run dev
# или
pnpm dev
```

### 6. Войдите в систему

1. Откройте [http://localhost:3000/crm/login](http://localhost:3000/crm/login)
2. Введите email и пароль администратора
3. Вы будете перенаправлены на дашборд

## 📱 Структура модулей

После входа вы увидите меню с модулями:

- **Дашборд** - обзор для вашей роли
- **Продажи** - управление сделками (Админ, Менеджер)
- **Задачи** - управление задачами монтажников
- **GPS устройства** - управление GPS (только Админ)
- **Финансы** - доходы, расходы, выплаты (только Админ)
- **Сотрудники** - управление персоналом (только Админ)
- **Настройки** - настройки системы (только Админ)

## 👥 Создание пользователей разных ролей

### Менеджер продаж

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "ManagerPass123!",
    "fullName": "Иван Менеджеров",
    "roleId": "uuid_роли_manager"
  }'
```

### Монтажник

```bash
curl -X POST http://localhost:3000/api/crm/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "installer@example.com",
    "password": "InstallerPass123!",
    "fullName": "Петр Монтажников",
    "roleId": "uuid_роли_installer"
  }'
```

**Где взять UUID ролей?**

```sql
SELECT id, name FROM crm_roles;
```

## 🔧 Настройка Admiral API

1. Получите API ключ от Admiral
2. Добавьте в `.env.local`:
   ```env
   ADMIRAL_API_KEY=your_key_here
   ADMIRAL_API_URL=https://api.admiral.com
   ```
3. Или настройте через интерфейс (Настройки → Admiral API)

## 📊 Первые шаги

1. **Создайте клиента** (через модуль Продажи)
2. **Создайте сделку** (укажите клиента, сумму, услуги)
3. **Создайте задачу** (назначьте монтажнику)
4. **Монтажник выполняет задачу** (меняет статус, загружает фото)
5. **Завершите сделку** (статус "Завершена")

## 🆘 Решение проблем

### Ошибка подключения к Supabase
- Проверьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Убедитесь, что таблицы созданы

### Ошибка авторизации
- Проверьте, что пользователь создан
- Убедитесь, что роль назначена правильно
- Проверьте JWT_SECRET в `.env.local`

### Таблицы не найдены
- Выполните `crm_database_schema.sql` в Supabase SQL Editor
- Проверьте, что все таблицы созданы: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'crm_%';`

### Мобильная версия не работает
- Все интерфейсы адаптированы для мобильных
- Используйте браузер с поддержкой современных стандартов
- Проверьте консоль браузера на ошибки

## 📚 Дополнительная документация

- Полная документация: `CRM_README.md`
- SQL схема: `crm_database_schema.sql`
- API endpoints: см. `CRM_README.md` раздел "API Endpoints"

## ✅ Готово!

Теперь у вас есть полнофункциональная CRM-система для управления бизнесом видеонаблюдения и монтажа!

