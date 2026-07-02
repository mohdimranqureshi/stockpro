package com.dealerpro.controller;

import com.dealerpro.dto.request.ScrapRequest;
import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.Scrap;
import com.dealerpro.entity.enums.ScrapStatus;
import com.dealerpro.service.impl.ScrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scrap")
@RequiredArgsConstructor
@Tag(name = "Scrap", description = "Scrap / Dead stock management")
@SecurityRequirement(name = "bearerAuth")
public class ScrapController {

    private final ScrapService scrapService;

    @GetMapping
    @Operation(summary = "List scrap items with optional status filter. " +
            "Admins can pass userId to filter by a specific user.")
    public ResponseEntity<ApiResponse<Page<Scrap>>> list(
            @RequestParam(required = false) ScrapStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(scrapService.findAll(status, userId, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Scrap>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(scrapService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Add scrap item record")
    public ResponseEntity<ApiResponse<Scrap>> create(@Valid @RequestBody ScrapRequest request) {
        Scrap scrap = scrapService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Scrap record added", scrap));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update scrap record (e.g. mark as sold)")
    public ResponseEntity<ApiResponse<Scrap>> update(
            @PathVariable Long id,
            @Valid @RequestBody ScrapRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Scrap updated", scrapService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        scrapService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Scrap deleted", null));
    }
}
