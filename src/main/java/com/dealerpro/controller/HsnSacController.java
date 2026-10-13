package com.dealerpro.controller;

import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.HsnMaster;
import com.dealerpro.entity.SacMaster;
import com.dealerpro.repository.HsnMasterRepository;
import com.dealerpro.repository.SacMasterRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "HSN / SAC", description = "Master search for HSN and SAC codes")
@SecurityRequirement(name = "bearerAuth")
public class HsnSacController {

    private final HsnMasterRepository hsnRepo;
    private final SacMasterRepository sacRepo;

    /**
     * GET /api/hsn?q=8528&size=100
     *
     * Searches HSN master — code prefix matches first, then description keywords.
     * Default size = 100. Frontend can pass &size=200 etc.
     * When q is blank, returns top 100 shortest codes (most common chapter codes).
     */
    @GetMapping("/hsn")
    @Operation(summary = "Search HSN codes — code prefix first, then description keywords. Default 100 results.")
    public ResponseEntity<ApiResponse<List<HsnMaster>>> searchHsn(
            @RequestParam(defaultValue = "")  String q,
            @RequestParam(defaultValue = "100") int size) {
        // Cap at 500 to prevent accidental full-table dumps
        int safeSize = Math.min(size, 500);
        Pageable pageable = PageRequest.of(0, safeSize);
        List<HsnMaster> results = hsnRepo.search(q, q, pageable).getContent();
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    /**
     * GET /api/sac?q=9954&size=100
     */
    @GetMapping("/sac")
    @Operation(summary = "Search SAC codes — code prefix first, then description keywords. Default 100 results.")
    public ResponseEntity<ApiResponse<List<SacMaster>>> searchSac(
            @RequestParam(defaultValue = "")  String q,
            @RequestParam(defaultValue = "100") int size) {
        int safeSize = Math.min(size, 500);
        Pageable pageable = PageRequest.of(0, safeSize);
        List<SacMaster> results = sacRepo.search(q, q, pageable).getContent();
        return ResponseEntity.ok(ApiResponse.ok(results));
    }
}
