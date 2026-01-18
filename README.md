# Hatch App - Mini App для Telegram

Mini app для отображения статистики по яйцам.

## API URL

Railway API: `https://web-production-11ef2.up.railway.app/api/stats`

## Деплой на Vercel

1. Подключите репозиторий к Vercel
2. В настройках проекта добавьте переменную окружения:
   - `API_URL` = `https://web-production-11ef2.up.railway.app/api/stats`
3. Vercel автоматически запустит build script, который инжектит API_URL в HTML

## Локальная разработка

```bash
# Установите зависимости (если нужно)
npm install

# Запустите build
npm run build

# Откройте index.html в браузере
```

## Структура

- `index.html` - главная страница
- `styles.css` - стили
- `app.js` - логика приложения
- `build.js` - скрипт для инжекции API_URL
- `vercel.json` - конфигурация Vercel
- `package.json` - зависимости и скрипты
