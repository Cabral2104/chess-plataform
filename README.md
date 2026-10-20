# Plataforma de Ajedrez Multijugador en Tiempo Real ♟️⚡

Plataforma web de ajedrez online multijugador con validación de movimientos oficiales FIDE, gestión atómica de relojes, emparejamiento por retos y sincronización en tiempo real vía WebSockets.

---

## 🛠️ Stack Tecnológico

* **Monorepositorio:** Estructura modular (`backend/`, `frontend/`).
* **Base de Datos:** PostgreSQL 16 sobre Docker (administrado con pgAdmin 4).
* **Backend:** PHP 8.2+ con Laravel 12 (API REST, Laravel Sanctum).
* **Tiempo Real / WebSockets:** Laravel Reverb (puerto `8085`, canal `presence-game.{code}`).
* **Frontend (en desarrollo):** Angular SPA (Signals / RxJS) + Tailwind CSS + `chess.js`.
* **Auditoría & Seguridad:** Soft Deletes, `user_created`, `user_edited`, contraseñas con hashing Bcrypt (costo 12) y tokens SHA-256.

---

## 🏛️ Arquitectura del Sistema

```
[ Frontend: Angular SPA ] ──(HTTP REST)──► [ Backend: Laravel 12 API ] ──► [ PostgreSQL 16 ]
         ▲                                           │
         └──────────(WebSockets / Reverb)────────────┘
                Canal: presence-game.{code}
```

### Características Implementadas:
1. **Autenticación Segura:** Registro e inicio de sesión con email o nombre de usuario (`username`), emisión de Bearer Tokens con Sanctum.
2. **Sistema de Retos y Salas:** Creación de retos con código único de 8 caracteres, preferencia de piezas (`white`, `black`, `random`) y asignación equitativa en transacción atómica.
3. **Motor de Juego y Relojes Atómicos:**
   * Cálculo de tiempo transcurrido en milisegundos sin desfase por latencia.
   * Caída de bandera automática (`timeout`) si el reloj llega a 0 ms.
   * Notación estándar PGN, FEN y casillas de origen/destino.
   * Respaldo para rebobinado de partida jugada a jugada (`fen_after`).
4. **Sistema de Puntuación Elo FIDE:**
   * Actualización matemática de puntuaciones tras cada partida (`K=32`).
   * Clasificaciones separadas por ritmo: Bullet, Blitz, Rapid y Clásico.
5. **Leaderboards y Perfiles:** Top 50 clasificados por modalidad, porcentaje de victorias (`win_rate`) e historial de partidas.

---

## 🚀 Puesta en Marcha del Entorno Local

### 1. Base de Datos (Docker)
```bash
docker compose up -d
```
* **Host:** `127.0.0.1:5432`
* **Base de datos:** `chess_db`
* **Usuario:** `chess_user`
* **Contraseña:** `chess_password`

### 2. Backend (Laravel API & Reverb)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

#### Iniciar el servidor API REST:
```bash
php artisan serve
# Escuchando en http://localhost:8000
```

#### Iniciar el servidor WebSockets (Reverb):
```bash
php artisan reverb:start --debug
# Escuchando en 0.0.0.0:8085
```

---

## 👥 Usuarios de Prueba Sembrados

| Usuario | Correo | Contraseña | Elo Inicial |
| :--- | :--- | :--- | :---: |
| `jugador1` | `jugador1@chess.local` | `password123` | 1200 |
| `jugador2` | `jugador2@chess.local` | `password123` | 1200 |
