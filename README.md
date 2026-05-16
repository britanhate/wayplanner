# WayPlanner

WayPlanner — SPA для планування подорожей: карта з точками, nearby-пошук, побудова маршруту в Google Maps, метро-карти міст і трекінг витрат з бюджетом.

## Техстек

- React 19 + Vite
- Leaflet + MapTiler tiles
- Supabase (`points`, `expenses`, `budgets`)
- PWA (через `vite-plugin-pwa`)

## Основний функціонал

- **Карта**
  - створення/редагування/видалення точок
  - geocoding і reverse geocoding
  - nearby-пошук місць поруч
  - побудова маршруту (відкриття transit route у Google Maps)
  - панель метро-карт
- **Фінанси**
  - список витрат
  - бюджет і валюта
  - синхронізація витрат із вартостями точок
- **Авторизація**
  - quick-login демо-користувачами (без plaintext паролів у коді)

## Структура проєкту

```text
src/
  app/                # App shell
  components/UI/      # Topbar, PWA status, shared UI blocks
  features/
    map/
    points/
    routes/
    metro/
    finance/
  lib/                # Auth, Supabase, ArcGIS helpers, constants
  shared/             # shared hooks, perf helpers, styles, types
```

## Швидкий старт

```bash
npm install
npm run dev
```

Збірка прод-версії:

```bash
npm run build
npm run preview
```

## Перевірки

```bash
npm run lint
```

## Дані та SQL

- `supabase_schema.sql` — базова схема БД.
- `sql/performance_indexes.sql` — індекси для оптимізації запитів.

## Нотатки

- Проєкт налаштований як PWA (генерація service worker під час build).
- Якщо змінюєш API-структуру таблиць у Supabase — синхронізуй типи/хуки у `src/lib` і `src/features`.
