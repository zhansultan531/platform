# DeployHub 🚀

Платформа для тестирования, деплоя и мониторинга веб-приложений.

## Технологии

| Слой | Стек |
|------|------|
| Frontend | React 18, TypeScript, Vite, Zustand, Recharts |
| Backend | Node.js, Express.js, Socket.io |
| База данных | PostgreSQL 16 + Prisma ORM |
| Кэш | Redis 7 |
| Инфраструктура | Docker, Docker Compose |
| Аутентификация | JWT + bcrypt |

## Запуск

### Требования
- Docker Desktop

### 1. Запустить
```bash
docker compose up --build
```

### 2. Открыть браузер
```
http://localhost:3000
```

База данных и тестовые данные создаются **автоматически** при первом запуске.

**Тестовый аккаунт:** `admin@deployhub.com` / `admin123`

## Структура проекта

```
platform/
├── frontend/           # React приложение
│   └── src/
│       ├── pages/      # Страницы (Apps, Pipeline, Metrics, Logs, Deploys)
│       ├── store/      # Глобальное состояние (Zustand)
│       ├── api/        # HTTP клиент (axios)
│       └── styles.css  # Стили + адаптивность
├── backend/
│   ├── src/
│   │   └── index.js    # Express сервер + WebSocket + REST API
│   └── prisma/
│       ├── schema.prisma  # Схема БД
│       └── seed.js        # Тестовые данные
└── docker-compose.yml
```

## API Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/apps` | Список приложений |
| POST | `/api/apps` | Создать приложение |
| DELETE | `/api/apps/:id` | Удалить приложение |
| POST | `/api/apps/:id/restart` | Запустить |
| POST | `/api/apps/:id/stop` | Остановить |
| GET | `/api/deploys` | История деплоев |
| POST | `/api/deploys` | Запустить деплой |
| POST | `/api/deploys/:id/rollback` | Откатить |
| GET | `/api/pipelines` | Пайплайны |
| POST | `/api/pipelines` | Запустить пайплайн |
| POST | `/api/pipelines/:id/cancel` | Отменить |
| GET | `/api/metrics/current` | Метрики |
| GET | `/api/logs` | Логи |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/register` | Регистрация |
| GET | `/health` | Состояние сервера |

## WebSocket

| Событие | Направление | Описание |
|---------|-------------|----------|
| `subscribe:logs` | клиент → сервер | Подписка на логи |
| `log:entry` | сервер → клиент | Новая запись лога |
| `subscribe:metrics` | клиент → сервер | Подписка на метрики |
| `metrics:update` | сервер → клиент | Обновление метрик каждые 3с |

## Функциональность

- ✅ Управление приложениями (CRUD, start/stop)
- ✅ CI/CD пайплайны с этапами в реальном времени
- ✅ Live метрики CPU, памяти, latency (WebSocket)
- ✅ Live логи с фильтрацией по уровню
- ✅ История деплоев с возможностью rollback
- ✅ Аутентификация (JWT + bcrypt)
- ✅ Адаптивный дизайн (mobile, tablet, desktop)
- ✅ 404 страница
- ✅ Обработка ошибок везде
