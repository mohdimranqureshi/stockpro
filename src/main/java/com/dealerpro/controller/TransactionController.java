package com.dealerpro.controller;

import com.dealerpro.dto.request.TransactionRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.Transaction;
import com.dealerpro.entity.enums.TransactionType;
import com.dealerpro.service.impl.TransactionService;
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
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Sales & Purchases")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    @Operation(summary = "List transactions with filters: type, date range, party, pagination. " +
            "Admins can pass userId to filter by a specific user; non-admins always see only their own.")
    public ResponseEntity<ApiResponse<Page<Transaction>>> list(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String party,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.findAll(type, from, to, party, userId, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Transaction>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Record a new sale or purchase. Auto-updates stock status on sale.")
    public ResponseEntity<ApiResponse<Transaction>> create(@Valid @RequestBody TransactionRequest request) {
        Transaction tx = transactionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Transaction recorded", tx));
    }

    @GetMapping("/summary")
    @Operation(summary = "Total sales, purchases and net P&L. Admins can pass userId to filter.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(
            @RequestParam(required = false) Long userId) {
        var sales = transactionService.totalSales(userId);
        var purchases = transactionService.totalPurchases(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "totalSales", sales,
                "totalPurchases", purchases,
                "netProfitLoss", sales.subtract(purchases)
        )));
    }

    @GetMapping("/profit-loss/monthly")
    @Operation(summary = "Month-wise P&L for a given year. Admins can pass userId to filter.")
    public ResponseEntity<ApiResponse<Object>> monthlyPL(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getMonthlyProfitLoss(year, userId)));
    }
}
