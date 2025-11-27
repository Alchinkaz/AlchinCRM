-- ============================================================
-- ПРЯМОЕ СОЗДАНИЕ ТЕСТОВОГО АДМИНИСТРАТОРА
-- Выполните этот SQL в Supabase SQL Editor
-- ============================================================

-- Удаляем существующего тестового пользователя (если есть)
DELETE FROM crm_users WHERE email = 'admin@test.kz';

-- Создаем тестового администратора
-- Пароль: Admin123!
-- ВАЖНО: Этот хеш создан с JWT_SECRET = 'your-secret-key-change-in-production'
-- Если у вас другой JWT_SECRET, нужно пересчитать хеш

INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'admin@test.kz',
  -- Хеш для пароля "Admin123!" с JWT_SECRET = 'your-secret-key-change-in-production'
  -- Если у вас другой JWT_SECRET в Vercel, нужно пересчитать хеш
  'c34671b922295503ea644790945ed015936338c4a89e1dfcc58c00110b8eda5f',
  'Тестовый Администратор',
  (SELECT id FROM crm_roles WHERE name = 'admin' LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM crm_users WHERE email = 'admin@test.kz'
);

-- Проверяем созданного пользователя
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM crm_users u
LEFT JOIN crm_roles r ON u.role_id = r.id
WHERE u.email = 'admin@test.kz';

-- Если пользователь создан, вы увидите его данные выше
-- Теперь можно войти с:
-- Email: admin@test.kz
-- Пароль: Admin123!

