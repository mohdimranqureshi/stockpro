package com.dealerpro.controller;

import com.dealerpro.dto.request.ReplacementRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.Replacement;
import com.dealerpro.service.impl.ReplacementService;
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

@RestController
@RequestMapping("/api/replacements")
@RequiredArgsConstructor
@Tag(name = "Replacements", description = "Vehicle exchange / replacement records")
@SecurityRequirement(name = "bearerAuth")
public class ReplacementController {

    private final ReplacementService replacementService;

    @GetMapping
    @Operation(summary = "List replacements with optional date range & customer filter. " +
            "Admins can pass userId to filter by a specific user.")
    public ResponseEntity<ApiResponse<Page<Replacement>>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String customer,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(replacementService.findAll(from, to, customer, userId, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Replacement>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(replacementService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Record a new replacement/exchange")
    public ResponseEntity<ApiResponse<Replacement>> create(@Valid @RequestBody ReplacementRequest request) {
        Replacement r = replacementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Replacement recorded", r));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        replacementService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Replacement deleted", null));
    }
}
