package com.dealerpro.controller;

import com.dealerpro.dto.request.StockRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.Stock;
import com.dealerpro.entity.enums.StockStatus;
import com.dealerpro.service.impl.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Tag(name = "Stock", description = "Vehicle inventory management")
@SecurityRequirement(name = "bearerAuth")
public class StockController {

    private final StockService stockService;

    @GetMapping
    @Operation(summary = "List inventory items with optional filters & pagination. " +
            "Admins can pass userId to filter by a specific user's data; non-admins always see only their own.")
    public ResponseEntity<ApiResponse<Page<Stock>>> list(
            @RequestParam(required = false) StockStatus status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return ResponseEntity.ok(ApiResponse.ok(stockService.findAll(status, name, userId, page, size, sort)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock item by ID")
    public ResponseEntity<ApiResponse<Stock>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(stockService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Add new item to inventory")
    public ResponseEntity<ApiResponse<Stock>> create(@Valid @RequestBody StockRequest request) {
        Stock created = stockService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Stock added successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update stock item")
    public ResponseEntity<ApiResponse<Stock>> update(
            @PathVariable Long id,
            @Valid @RequestBody StockRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Stock updated", stockService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete stock item (Admin only)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        stockService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Stock deleted", null));
    }
}
