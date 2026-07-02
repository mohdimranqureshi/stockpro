package com.dealerpro.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthRequest {

    @Data
    public static class Login {
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
    }

    @Data
    public static class Register {
        @NotBlank @Size(min = 2, max = 100)
        private String name;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 8)
        private String password;
        private String role = "STAFF";
    }

    @Data
    public static class ChangePassword {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 8) private String newPassword;
    }
}
