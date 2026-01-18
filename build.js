const fs = require('fs');
const path = require('path');

// Получаем API_URL из переменных окружения
// Если указан /api/stats, извлекаем базовый URL
let apiUrlEnv = process.env.API_URL || 'https://web-production-9eac6.up.railway.app/api/stats';
// Убираем /api/stats или /stats из конца, если есть
if (apiUrlEnv.endsWith('/api/stats')) {
    apiUrlEnv = apiUrlEnv.replace('/api/stats', '/api');
} else if (apiUrlEnv.endsWith('/stats')) {
    apiUrlEnv = apiUrlEnv.replace('/stats', '/api');
} else if (!apiUrlEnv.endsWith('/api')) {
    // Если не заканчивается на /api, добавляем
    apiUrlEnv = apiUrlEnv.endsWith('/') ? apiUrlEnv + 'api' : apiUrlEnv + '/api';
}

const API_URL = apiUrlEnv;

// Файлы, в которые нужно инжектировать API_URL
const filesToInject = ['index.html', 'eggchain.html'];

filesToInject.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Инжектируем API_URL в скрипт перед закрывающим тегом body
        const scriptTag = `<script>window.API_URL = '${API_URL}';</script>`;
        
        // Проверяем, не добавлен ли уже скрипт
        if (!content.includes('window.API_URL')) {
            content = content.replace('</body>', `  ${scriptTag}\n</body>`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Injected API_URL into ${file}`);
        } else {
            // Обновляем существующий API_URL
            content = content.replace(/window\.API_URL\s*=\s*['"][^'"]*['"];/, `window.API_URL = '${API_URL}';`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated API_URL in ${file}`);
        }
    } else {
        console.log(`⚠ File ${file} not found, skipping...`);
    }
});

console.log('Build completed!');
