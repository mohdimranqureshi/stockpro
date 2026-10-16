package com.dealerpro.service.impl;

import com.dealerpro.dto.request.AuthRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.User;
import com.dealerpro.entity.enums.UserRole;
import com.dealerpro.exception.BusinessException;
import com.dealerpro.exception.DuplicateResourceException;
import com.dealerpro.repository.UserRepository;
import com.dealerpro.security.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    private static final int MAX_FAILED_LOGINS = 5;
    private static final long LOCKOUT_MS = 15 * 60 * 1000L;

    // email -> {failedCount, windowStartMs}; in-memory, per instance
    private final Map<String, long[]> failedLogins = new ConcurrentHashMap<>();

    public ApiResponse<Map<String, Object>> login(AuthRequest.Login request) {
        String key = request.getEmail().toLowerCase();
        long now = System.currentTimeMillis();
        long[] state = failedLogins.get(key);
        if (state != null && now - state[1] < LOCKOUT_MS && state[0] >= MAX_FAILED_LOGINS) {
            throw new BusinessException("Too many failed login attempts. Try again later.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException e) {
            failedLogins.compute(key, (k, v) -> (v == null || now - v[1] >= LOCKOUT_MS)
                    ? new long[] { 1, now } : new long[] { v[0] + 1, v[1] });
            throw e;
        }
        failedLogins.remove(key);

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return ApiResponse.ok("Login successful", Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "tokenType", "Bearer",
                "expiresIn", jwtService.getExpirationMs(),
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                )
        ));
    }

    @Transactional
    public ApiResponse<Map<String, Object>> register(AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                // Public registration never grants elevated roles; admins use /api/users
                .role(UserRole.STAFF)
                .active(true)
                .build();

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return ApiResponse.ok("Registration successful", Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "tokenType", "Bearer",
                "expiresIn", jwtService.getExpirationMs(),
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                )
        ));
    }
}
