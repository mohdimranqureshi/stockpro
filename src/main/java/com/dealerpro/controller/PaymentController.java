package com.dealerpro.controller;

import com.dealerpro.dto.request.PaymentRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.Payment;
import com.dealerpro.entity.enums.FlowType;
import com.dealerpro.service.impl.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Cash Inflow & Outflow")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @Operation(summary = "List payments with optional flow type & date filters. " +
            "Admins can pass userId to filter by a specific user.")
    public ResponseEntity<ApiResponse<Page<Payment>>> list(
            @RequestParam(required = false) FlowType flowType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.findAll(flowType, from, to, userId, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Payment>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Record inflow or outflow payment")
    public ResponseEntity<ApiResponse<Payment>> create(@Valid @RequestBody PaymentRequest request) {
        Payment payment = paymentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Payment recorded", payment));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete payment (Admin only)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        paymentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Payment deleted", null));
    }

    @GetMapping("/totals")
    @Operation(summary = "Total inflow, outflow and net cash position. Admins can pass userId to filter.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> totals(
            @RequestParam(required = false) Long userId) {
        var inflow  = paymentService.totalInflow(userId);
        var outflow = paymentService.totalOutflow(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "totalInflow",  inflow,
                "totalOutflow", outflow,
                "netCash",      inflow.subtract(outflow)
        )));
    }
}
