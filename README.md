# Plataforma de Ajedrez Multijugador en Tiempo Real

Plataforma web de ajedrez online multijugador con validacion de movimientos oficiales FIDE, gestion atomica de relojes, emparejamiento por retos y sincronizacion en tiempo real via WebSockets.

---

## Stack Tecnologico

* **Monorepositorio:** Estructura modular (`backend/`, `frontend/`).
* **Base de Datos:** PostgreSQL 16 sobre Docker (puerto `5432`).
* **Backend:** PHP 8.2+ con Laravel 12 (API REST, Laravel Sanctum).
* **Tiempo Real / WebSockets:** Laravel Reverb (puerto `8085`, canal de presencia `presence-game.{code}`).
* **Frontend:** Angular 19 SPA (Signals, RxJS, Tailwind CSS, `chess.js`).
* **Auditoria y Seguridad:** Soft Deletes, hashing Bcrypt y tokens de acceso personal con Sanctum.

---

## Requisitos Previos en el Equipo

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:
1. **Git**
2. **Node.js** (v18 o superior) y **npm**
3. **PHP 8.2 o superior** y **Composer**
   - Asegúrate de habilitar en tu archivo `php.ini` las extensiones:
     - `extension=pdo_pgsql`
     - `extension=pgsql`
     - `extension=mbstring`
     - `extension=openssl`
     - `extension=curl`
     - `extension=fileinfo`
     - `zend_extension=opcache`
     - `opcache.enable=1`
     - `opcache.enable_cli=1`
4. **Docker Desktop** (para levantar PostgreSQL de forma automatizada)

---

## Guia de Puesta en Marcha (Paso a Paso)

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd chess-plataform
```

### 2. Levantar la Base de Datos (Docker)
Inicia el contenedor de PostgreSQL 16:
```bash
docker compose up -d
```
* **Host:** `127.0.0.1:5432`
* **Base de datos:** `chess_db`
* **Usuario:** `chess_user`
* **Contrasena:** `chess_password`

### 3. Configurar y Preparar el Backend (Laravel)
Abre una terminal y ejecuta:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan optimize
```
> En Windows PowerShell o CMD, puedes usar `copy .env.example .env`.

### 4. Configurar el Frontend (Angular)
En otra terminal (o desde la raiz del proyecto):
```bash
cd frontend
npm install
```

---

## Ejecucion para Demostracion Local

Para probar la plataforma en vivo necesitas tres terminales activas:

### Terminal 1: Servidor API REST (Backend - accesible en red local Wi-Fi/LAN)
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```
*Disponible en: `http://localhost:8000` y en `http://<TU_IP_LOCAL>:8000`*

### Terminal 2: Servidor de Desarrollo (Angular Frontend - accesible en red local Wi-Fi/LAN)
```bash
cd frontend
npm start
```
*(Ejecuta `ng serve --host 0.0.0.0` automáticamente)*
*Disponible en: `http://localhost:4200` y desde cualquier celular/laptop en la misma red Wi-Fi entrando a `http://<TU_IP_LOCAL>:4200`*

### Terminal 3 (Opcional): Servidor WebSockets (Laravel Reverb)
> **Nota:** La aplicación cuenta con sincronización reactiva automática por HTTP cada 2 segundos, por lo que funciona al 100% sin necesidad de encender Reverb. Si deseas habilitar además el canal WebSocket puro:
```bash
cd backend
php artisan reverb:start --host=0.0.0.0 --port=8085
```

---

## Guia para la Demostracion en Clase

Para simular una partida entre dos jugadores en la misma computadora:

1. **Ventana 1 (Navegador normal):**
   - Ingresa a `http://localhost:4200`.
   - Inicia sesion con el Jugador 1:
     - **Usuario:** `jugador1`
     - **Contrasena:** `password123`
   - Ve a **Jugar** y crea un reto o selecciona una modalidad (ej. Blitz 3+2).

2. **Ventana 2 (Ventana de Incognito o navegador alternativo como Edge/Firefox):**
   - Ingresa a `http://localhost:4200`.
   - Inicia sesion con el Jugador 2:
     - **Usuario:** `jugador2`
     - **Contrasena:** `password123`
   - Ve a **Sala y Retos**, localiza la partida creada por `jugador1` y haz clic en **Aceptar Reto** (o pega el enlace directo).

3. **Pruebas en tiempo real:**
   - Realiza jugadas alternadas en ambas ventanas y observa la sincronizacion instantanea via WebSockets.
   - Envia mensajes por el chat integrado.
   - Observa el descuento milimetrico de los relojes de ajedrez.
   - Prueba las opciones de rendicion, oferta de tablas o fin de partida.
