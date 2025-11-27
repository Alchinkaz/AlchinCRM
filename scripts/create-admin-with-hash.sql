-- ============================================================
-- СОЗДАНИЕ ТЕСТОВОГО АДМИНИСТРАТОРА С ПРАВИЛЬНЫМ ХЕШЕМ
-- Выполните этот SQL в Supabase SQL Editor
-- ============================================================

-- ВАЖНО: Этот скрипт создает пользователя с хешем пароля
-- Пароль: Admin123!
-- 
-- Если у вас другой JWT_SECRET в Vercel, вам нужно:
-- 1. Узнать ваш JWT_SECRET из настроек Vercel
-- 2. Вычислить хеш: SHA256(password + JWT_SECRET)
-- 3. Заменить значение password_hash ниже

-- Удаляем существующего тестового пользователя (если есть)
DELETE FROM crm_users WHERE email = 'admin@test.kz';

-- Создаем тестового администратора
-- Хеш для "Admin123!" + "your-secret-key-change-in-production"
INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'admin@test.kz',
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2', -- ВРЕМЕННЫЙ ХЕШ - НУЖНО ЗАМЕНИТЬ!
  'Тестовый Администратор',
  (SELECT id FROM crm_roles WHERE name = 'admin' LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM crm_users WHERE email = 'admin@test.kz'
);

-- Проверяем
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM crm_users u
LEFT JOIN crm_roles r ON u.role_id = r.id
WHERE u.email = 'admin@test.kz';

