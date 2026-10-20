<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo jugador en la plataforma.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:30', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar_url' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($validated['username']),
            'presence_status' => 'offline',
            'status' => 1,
        ]);

        // Inicializar puntuaciones Elo de 1200 por modalidad
        $modes = ['bullet', 'blitz', 'rapid', 'classical'];
        foreach ($modes as $type) {
            UserRating::create([
                'user_id' => $user->id,
                'type' => $type,
                'rating' => 1200,
                'peak_rating' => 1200,
                'games_count' => 0,
                'wins_count' => 0,
                'losses_count' => 0,
                'draws_count' => 0,
                'status' => 1,
            ]);
        }

        // Emite token de autenticación Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado exitosamente.',
            'user' => $user->load('ratings'),
            'token' => $token,
        ], 201);
    }

    /**
     * Iniciar sesión con email o username.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = $request->input('login');

        // Buscar por email o username
        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Validar baja lógica / cuenta inactiva
        if ($user->status !== 1) {
            return response()->json([
                'message' => 'Tu cuenta se encuentra inactiva o deshabilitada. Contacta al administrador.',
            ], 403);
        }

        // Actualizar última actividad
        $user->update(['last_seen_at' => now()]);

        // Generar token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'user' => $user->load('ratings'),
            'token' => $token,
        ]);
    }

    /**
     * Cerrar sesión y revocar el token actual.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * Obtener el perfil y estadísticas del usuario autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('ratings'),
        ]);
    }
}
