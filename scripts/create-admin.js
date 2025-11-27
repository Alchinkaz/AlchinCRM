// Скрипт для создания первого администратора
// Запуск: node scripts/create-admin.js

const crypto = require('crypto');

// Функция для хеширования пароля (та же логика, что в crm-auth.ts)
async function hashPassword(password) {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return new Promise((resolve, reject) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + secret);
    crypto.subtle.digest('SHA-256', Buffer.from(data))
      .then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      })
      .catch(reject);
  });
}

// Альтернативный способ хеширования для Node.js
function hashPasswordSync(password) {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return crypto.createHash('sha256').update(password + secret).digest('hex');
}

async function createAdmin() {
  const email = process.argv[2] || 'admin@alchin.kz';
  const password = process.argv[3] || 'Admin123!';
  const fullName = process.argv[4] || 'Администратор';

  console.log('Создание администратора...');
  console.log('Email:', email);
  console.log('Пароль:', password);
  console.log('Имя:', fullName);

  // Хешируем пароль
  const passwordHash = hashPasswordSync(password);
  
  console.log('\nВыполните следующий SQL запрос в Supabase SQL Editor:\n');
  console.log('-- Сначала получите ID роли администратора');
  console.log("SELECT id FROM crm_roles WHERE name = 'admin';");
  console.log('\n-- Затем создайте пользователя (замените ROLE_ID на полученный ID):');
  console.log(`INSERT INTO crm_users (email, password_hash, full_name, role_id, is_active)`);
  console.log(`VALUES (`);
  console.log(`  '${email}',`);
  console.log(`  '${passwordHash}',`);
  console.log(`  '${fullName}',`);
  console.log(`  (SELECT id FROM crm_roles WHERE name = 'admin'),`);
  console.log(`  true`);
  console.log(`);`);
  console.log('\nИли используйте API для регистрации:');
  console.log(`curl -X POST http://localhost:3000/api/crm/auth/register \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"${email}","password":"${password}","fullName":"${fullName}"}'`);
}

createAdmin().catch(console.error);

