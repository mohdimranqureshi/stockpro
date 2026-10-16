package com.dealerpro.controller;

import com.dealerpro.dto.response.ApiResponse;
import com.dealerpro.entity.HsnGstRate;
import com.dealerpro.repository.HsnGstRateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gst")
@RequiredArgsConstructor
@Tag(name = "GST Rate", description = "Fetch GST rate for a given HSN code")
@SecurityRequirement(name = "bearerAuth")
public class GstRateController {

    private final HsnGstRateRepository hsnGstRateRepo;

    /**
     * GET /api/gst/rate?hsn=8528
     *
     * Looks up the GST rate in the hsn_gst_rate table, falling back to
     * progressively shorter parent codes (8 -> 6 -> 4 -> 2 digits).
     *
     * Response: { hsnCode: "8528", gstRate: 18, found: true }
     *           { hsnCode: "9999", gstRate: null, found: false }
     */
    @GetMapping("/rate")
    @Operation(summary = "Get GST rate for an HSN code from the hsn_gst_rate table")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGstRate(
            @RequestParam String hsn) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hsnCode", hsn);
        result.put("found", false);
        result.put("gstRate", null);

        String wanted = hsn.trim();
        if (!wanted.matches("\\d{2,8}")) {
            return ResponseEntity.ok(ApiResponse.ok("Invalid HSN code", result));
        }

        for (int len = wanted.length(); len >= 2; len -= (len > 2 ? 2 : 1)) {
            List<HsnGstRate> rows = hsnGstRateRepo.findByHsnCodeOrderByIdAsc(wanted.substring(0, len));
            if (!rows.isEmpty()) {
                HsnGstRate row = rows.get(0);
                result.put("gstRate", row.getGstRate());
                result.put("found", true);
                result.put("matchedCode", row.getHsnCode());
                result.put("description", row.getDescription());
                break;
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
