package com.dealerpro.controller;

import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.service.impl.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "KPI summary & analytics")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get full dashboard KPIs, recent transactions & monthly P&L. " +
            "Admins can pass userId to view a specific user's dashboard.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSummary(userId)));
    }
}
