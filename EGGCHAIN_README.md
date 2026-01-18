# Eggchain Explorer - Инструкция по интеграции

## Что было создано

1. **Страница Explorer** (`eggchain.html`, `eggchain.css`, `eggchain.js`)
   - Поиск яиц по уникальному идентификатору
   - Отображение информации о яйце (кто отправил, кто вылупил, даты)
   - Список всех яиц, отправленных пользователем

2. **API Endpoints** (`bot/eggchain_api.py`)
   - `GET /api/egg/{egg_id}` - получение информации о яйце
   - `GET /api/user/{user_id}/eggs` - получение списка яиц пользователя

3. **Интеграция в mini app**
   - Кнопка "Eggchain Explorer" в профиле
   - Роутинг через `vercel.json`

## Шаги для деплоя

### 1. Обновите бота (Railway)

1. Скопируйте файл `bot/eggchain_api.py` в ваш репозиторий бота
2. Откройте `bot.py` и добавьте импорт:
   ```python
   from eggchain_api import setup_eggchain_routes
   ```
3. В функции, где создается aiohttp приложение, добавьте:
   ```python
   setup_eggchain_routes(app)
   ```
4. Убедитесь, что в базе данных есть таблица `eggs` с полями:
   - `egg_id` (TEXT PRIMARY KEY)
   - `sender_id` (INTEGER)
   - `recipient_id` (INTEGER, nullable)
   - `hatched_by` (INTEGER, nullable)
   - `timestamp_sent` (TEXT)
   - `timestamp_hatched` (TEXT, nullable)
   - `status` (TEXT, nullable)

5. Убедитесь, что при создании яйца сохраняется уникальный `egg_id`
6. При вылуплении яйца обновляйте поле `hatched_by` и `timestamp_hatched`

### 2. Обновите mini app (Vercel)

1. Загрузите все файлы в репозиторий `hatchapp`:
   - `eggchain.html`
   - `eggchain.css`
   - `eggchain.js`
   - `egg-icon.tgs` (скопируйте из `C:\Users\leviv\Downloads\chpic.su_-_NewsEmoji_051.tgs`)
   - Обновленный `index.html`
   - Обновленный `styles.css`
   - Обновленный `package.json`
   - Обновленный `vercel.json`
   - `build.js`

2. В настройках Vercel проекта добавьте переменную окружения:
   - `API_URL` = `https://your-railway-url.railway.app/api`
   (замените на ваш URL Railway API)

3. Vercel автоматически запустит `npm run build`, который инжектирует `API_URL` в HTML файлы

### 3. Проверка работы

1. Откройте mini app в Telegram
2. Перейдите в профиль
3. Нажмите "Eggchain Explorer"
4. Попробуйте найти яйцо по ID
5. Проверьте список ваших яиц

## API Endpoints

### GET /api/egg/{egg_id}

Возвращает информацию о конкретном яйце.

**Response:**
```json
{
  "egg_id": "uuid-here",
  "sender_id": 123456789,
  "sender_username": "username",
  "recipient_id": 987654321,
  "hatched_by": 987654321,
  "hatched_by_username": "username2",
  "timestamp_sent": "2026-01-17T20:00:00",
  "timestamp_hatched": "2026-01-17T21:00:00",
  "status": "hatched"
}
```

### GET /api/user/{user_id}/eggs

Возвращает список всех яиц, отправленных пользователем.

**Response:**
```json
{
  "eggs": [
    {
      "egg_id": "uuid-here",
      "sender_id": 123456789,
      "recipient_id": 987654321,
      "hatched_by": 987654321,
      "hatched_by_username": "username2",
      "timestamp_sent": "2026-01-17T20:00:00",
      "timestamp_hatched": "2026-01-17T21:00:00",
      "status": "hatched"
    }
  ]
}
```

## Структура файлов

```
hatchapp/
├── eggchain.html          # Страница explorer
├── eggchain.css           # Стили для explorer
├── eggchain.js            # Логика explorer
├── egg-icon.tgs           # Иконка для explorer
├── index.html             # Главная страница (обновлена)
├── styles.css             # Стили (обновлены)
├── build.js               # Скрипт для инжекции API_URL
├── package.json           # Обновлен с build скриптом
└── vercel.json            # Роутинг для Vercel

bot/
├── eggchain_api.py        # API endpoints для explorer
└── INTEGRATION.md         # Инструкция по интеграции
```

## Примечания

- Убедитесь, что иконка `egg-icon.tgs` загружена в репозиторий
- Если формат `.tgs` не поддерживается браузером, можно конвертировать в PNG/GIF
- API должен быть доступен публично для работы explorer
- User ID получается из Telegram WebApp автоматически
