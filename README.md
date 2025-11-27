# 🚀 Alchin CRM

CRM-система для управления бизнесом видеонаблюдения, монтажа и GPS-мониторинга.

## 📍 Расположение проекта

**Путь:** `/home/alchin/projects/AlchinCRM`

**Windows путь:** `\\wsl.localhost\Ubuntu-22.04\home\alchin\projects\AlchinCRM`

## 🚀 Быстрый старт

### 1. Установите зависимости

```bash
cd /home/alchin/projects/AlchinCRM
npm install
# или
pnpm install
```

### 2. Настройте переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```bash
cp .env.example .env.local
```

Заполните значения:
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key из Supabase
- `JWT_SECRET` - Секретный ключ для JWT (минимум 32 символа)
- `ADMIRAL_API_KEY` - API ключ Admiral (опционально)

### 3. Создайте базу данных

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Выполните код из `crm_database_schema.sql`

### 4. Запустите проект

```bash
npm run dev
# или
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 📚 Документация

- `CRM_README.md` - Полная документация
- `CRM_QUICK_START.md` - Быстрый старт
- `CRM_STRUCTURE.md` - Структура проекта

## 🛠 Технологии

- Next.js 15
- React 19
- TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS
- shadcn/ui

## 📝 Лицензия

Внутреннее использование

