package com.dealerpro.controller;

import com.dealerpro.dto.request.AuthRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.User;
import com.dealerpro.entity.enums.UserRole;
import com.dealerpro.exception.DuplicateResourceException;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management — Admin only")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @Operation(summary = "List all users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "role", u.getRole(),
                        "active", u.isActive(),
                        "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
                )).toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping
    @Operation(summary = "Create a new staff/manager user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @Valid @RequestBody AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.valueOf(request.getRole().toUpperCase()))
                .active(true)
                .build();
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("User created", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        )));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Enable or disable a user account")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleActive(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(!user.isActive());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(
                "User " + (user.isActive() ? "enabled" : "disabled"),
                Map.of("id", user.getId(), "active", user.isActive())
        ));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change a user's role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setRole(UserRole.valueOf(body.get("role").toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Role updated",
                Map.of("id", user.getId(), "role", user.getRole())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user (cannot delete yourself)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        userRepository.delete(user);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }

    @PatchMapping("/{id}/reset-password")
    @Operation(summary = "Reset a user's password (Admin)")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Password must be at least 8 characters"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully", null));
    }
}
