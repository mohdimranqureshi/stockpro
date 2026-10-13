package com.dealerpro.controller;

import com.dealerpro.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/gst")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "GST Rate", description = "Fetch GST rate for a given HSN code")
@SecurityRequirement(name = "bearerAuth")
public class GstRateController {

    private static final String RATES_URL = "https://hsncodefinder.app/api/rates.php";

    private final ObjectMapper objectMapper;

    /**
     * GET /api/gst/rate?hsn=8528
     *
     * Calls hsncodefinder.app/api/rates.php, filters by c == hsnCode,
     * returns the GST rate (r field) for the matching entry.
     *
     * Response: { hsnCode: "8528", gstRate: 18, found: true }
     *           { hsnCode: "9999", gstRate: null, found: false }
     */
    @GetMapping("/rate")
    @Operation(summary = "Get GST rate for an HSN code from hsncodefinder.app")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGstRate(
            @RequestParam String hsn) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hsnCode", hsn);
        result.put("found", false);
        result.put("gstRate", null);

        try {
            RestTemplate restTemplate = new RestTemplate();
            String json = restTemplate.getForObject(RATES_URL, String.class);

            if (json == null || json.isBlank()) {
                return ResponseEntity.ok(ApiResponse.ok("No data from GST API", result));
            }

            JsonNode root = objectMapper.readTree(json);

            // Handle both array and object-with-array responses
            JsonNode arr = root.isArray() ? root : root.path("data");

            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    // c = HSN code, r = GST rate
                    String code = node.has("c") ? node.get("c").asText("").trim() : "";
                    if (code.equalsIgnoreCase(hsn.trim())) {
                        JsonNode rateNode = node.get("r");
                        if (rateNode != null && !rateNode.isNull()) {
                            double rate = rateNode.asDouble();
                            result.put("gstRate", rate);
                            result.put("found", true);
                            result.put("description", node.has("d") ? node.get("d").asText("") : "");
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("GST rate lookup failed for HSN {}: {}", hsn, e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
