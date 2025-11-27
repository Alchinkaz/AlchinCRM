-- SQL скрипт для создания тестового администратора
-- Выполните этот скрипт в Supabase SQL Editor
-- 
-- ВАЖНО: Этот скрипт создает пользователя с временным паролем
-- После создания войдите через API /api/crm/auth/login, 
-- и пароль будет правильно захеширован

-- Тестовые данные
DO $$
DECLARE
  admin_role_id UUID;
  test_user_id UUID;
  temp_password_hash TEXT := 'temp_hash_will_be_updated_on_first_login';
BEGIN
  -- Получаем ID роли администратора
  SELECT id INTO admin_role_id 
  FROM crm_roles 
  WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Роль администратора не найдена! Убедитесь, что вы выполнили crm_database_schema.sql';
  END IF;
  
  -- Проверяем, существует ли уже пользователь
  SELECT id INTO test_user_id 
  FROM crm_users 
  WHERE email = 'admin@test.kz';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Пользователь admin@test.kz уже существует с ID: %', test_user_id;
    RAISE EXCEPTION 'Пользователь уже существует!';
  END IF;
  
  -- Создаем тестового администратора
  INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)
  VALUES (
    'admin@test.kz',
    temp_password_hash,
    'Тестовый Администратор',
    admin_role_id,
    true
  )
  RETURNING id INTO test_user_id;
  
  RAISE NOTICE '✅ Тестовый администратор создан!';
  RAISE NOTICE 'ID: %', test_user_id;
  RAISE NOTICE 'Email: admin@test.kz';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ВАЖНО: Для правильного хеширования пароля:';
  RAISE NOTICE '1. Используйте API: POST /api/crm/auth/register';
  RAISE NOTICE '2. Или войдите через /api/crm/auth/login с паролем Admin123!';
  RAISE NOTICE '   (пароль будет правильно захеширован при первом входе)';
  
END $$;

-- Проверка созданного пользователя
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

