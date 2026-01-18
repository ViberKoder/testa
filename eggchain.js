// Получаем API URL из window (инжектится через api/config.js)
// Используем EGGCHAIN_API_URL если доступен, иначе извлекаем из API_URL
const API_URL = window.EGGCHAIN_API_URL || (() => {
    let apiUrl = window.API_URL || 'https://web-production-9eac6.up.railway.app/api';
    if (apiUrl.endsWith('/api/stats')) {
        apiUrl = apiUrl.replace('/api/stats', '/api');
    } else if (apiUrl.endsWith('/stats')) {
        apiUrl = apiUrl.replace('/stats', '/api');
    } else if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.endsWith('/') ? apiUrl + 'api' : apiUrl + '/api';
    }
    return apiUrl;
})();

// Получаем Telegram WebApp объект
const tg = window.Telegram?.WebApp;

// Инициализация Telegram WebApp
if (tg) {
    tg.ready();
    tg.expand();
}

// Получаем user_id из Telegram WebApp или из параметров URL
function getUserId() {
    if (tg?.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id;
    }
    
    // Fallback: пытаемся получить из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user_id');
}

// Поиск яйца по ID
async function searchEgg(eggId) {
    if (!eggId || !eggId.trim()) {
        showError('Введите идентификатор яйца');
        return;
    }

    const resultDiv = document.getElementById('searchResult');
    resultDiv.innerHTML = '<div class="loading">Поиск...</div>';

    try {
        const response = await fetch(`${API_URL}/egg/${eggId.trim()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Яйцо не найдено');
        }

        displayEggResult(data);
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
}

// Отображение результата поиска яйца
function displayEggResult(egg) {
    const resultDiv = document.getElementById('searchResult');
    
    const hatchedStatus = egg.hatched_by ? 'hatched' : 'pending';
    const hatchedText = egg.hatched_by ? 'Вылуплено' : 'Ожидает вылупления';
    
    const timestampSent = egg.timestamp_sent ? new Date(egg.timestamp_sent).toLocaleString('ru-RU') : 'Неизвестно';
    const timestampHatched = egg.timestamp_hatched ? new Date(egg.timestamp_hatched).toLocaleString('ru-RU') : '—';

    resultDiv.innerHTML = `
        <div class="egg-card">
            <h3>🥚 Яйцо #${egg.egg_id}</h3>
            <div class="egg-info">
                <div class="info-row">
                    <span class="info-label">Идентификатор:</span>
                    <span class="info-value" style="font-family: monospace;">${egg.egg_id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Статус:</span>
                    <span class="info-value">
                        <span class="status ${hatchedStatus}">${hatchedText}</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Отправил:</span>
                    <span class="info-value">${egg.sender_username || `ID: ${egg.sender_id}`}</span>
                </div>
                ${egg.hatched_by ? `
                <div class="info-row">
                    <span class="info-label">Вылупил:</span>
                    <span class="info-value">${egg.hatched_by_username || `ID: ${egg.hatched_by}`}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Отправлено:</span>
                    <span class="info-value">${timestampSent}</span>
                </div>
                ${egg.timestamp_hatched ? `
                <div class="info-row">
                    <span class="info-label">Вылуплено:</span>
                    <span class="info-value">${timestampHatched}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Загрузка яиц пользователя
async function loadMyEggs() {
    const userId = getUserId();
    const eggsListDiv = document.getElementById('myEggsList');

    if (!userId) {
        eggsListDiv.innerHTML = '<div class="error">Не удалось определить пользователя. Откройте через Telegram бота.</div>';
        return;
    }

    eggsListDiv.innerHTML = '<div class="loading">Загрузка ваших яиц...</div>';

    try {
        const response = await fetch(`${API_URL}/user/${userId}/eggs`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка загрузки');
        }

        displayMyEggs(data.eggs || []);
    } catch (error) {
        eggsListDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
}

// Отображение списка яиц пользователя
function displayMyEggs(eggs) {
    const eggsListDiv = document.getElementById('myEggsList');

    if (eggs.length === 0) {
        eggsListDiv.innerHTML = '<div class="empty">У вас пока нет отправленных яиц</div>';
        return;
    }

    eggsListDiv.innerHTML = eggs.map(egg => {
        const hatchedStatus = egg.hatched_by ? 'hatched' : 'pending';
        const hatchedText = egg.hatched_by ? 'Вылуплено' : 'Ожидает';
        const timestampSent = egg.timestamp_sent ? new Date(egg.timestamp_sent).toLocaleString('ru-RU') : 'Неизвестно';

        return `
            <div class="egg-item" onclick="searchEggById('${egg.egg_id}')">
                <div class="egg-item-header">
                    <span class="egg-id">#${egg.egg_id}</span>
                    <span class="status ${hatchedStatus}">${hatchedText}</span>
                </div>
                <div class="egg-meta">
                    <div>Отправлено: ${timestampSent}</div>
                    ${egg.hatched_by ? `<div>Вылупил: ${egg.hatched_by_username || `ID: ${egg.hatched_by}`}</div>` : '<div>Ожидает вылупления</div>'}
                </div>
            </div>
        `;
    }).join('');
}

// Поиск яйца по клику из списка
function searchEggById(eggId) {
    document.getElementById('eggIdInput').value = eggId;
    searchEgg(eggId);
    // Прокрутка к результату поиска
    document.querySelector('.search-section').scrollIntoView({ behavior: 'smooth' });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Обработчик поиска
    const searchBtn = document.getElementById('searchBtn');
    const eggIdInput = document.getElementById('eggIdInput');

    searchBtn.addEventListener('click', () => {
        searchEgg(eggIdInput.value);
    });

    eggIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchEgg(eggIdInput.value);
        }
    });

    // Загружаем яйца пользователя
    loadMyEggs();
});
