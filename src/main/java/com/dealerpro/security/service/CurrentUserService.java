package com.dealerpro.security.service;

import com.dealerpro.entity.User;
import com.dealerpro.entity.enums.UserRole;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolves the currently authenticated user from the Spring Security
 * context. Used to enforce data ownership: non-admins only ever see
 * records they created, while admins can see everything (and optionally
 * filter by a specific user).
 */
@Service
public class CurrentUserService {

    public User getUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return null;
        }
        return user;
    }

    public Long getUserId() {
        User user = getUser();
        return user != null ? user.getId() : null;
    }

    public boolean isAdmin() {
        User user = getUser();
        return user != null && user.getRole() == UserRole.ADMIN;
    }

    /**
     * Resolves the effective "createdBy" filter to apply to a query.
     * - Non-admins: always forced to their own ID (ignores any requestedUserId).
     * - Admins: use requestedUserId if provided (to filter by a specific user),
     *           or null to see everyone's data.
     */
    public Long resolveDataFilter(Long requestedUserId) {
        if (!isAdmin()) {
            return getUserId();
        }
        return requestedUserId; // null = all users (admin sees everything)
    }
}
