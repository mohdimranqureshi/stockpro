package com.dealerpro.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Supports browsers that still have a cached index.html pointing to older
 * Vite content-hashed asset names after a new deployment switched to stable
 * asset filenames.
 */
@Controller
public class AssetFallbackController {

    @GetMapping("/assets/index-*.js")
    public String forwardHashedIndexScript() {
        return "forward:/assets/index.js";
    }

    @GetMapping("/assets/index-*.css")
    public String forwardHashedIndexStylesheet() {
        return "forward:/assets/index.css";
    }

    @GetMapping("/assets/vendor-*.js")
    public String forwardHashedVendorScript() {
        return "forward:/assets/vendor.js";
    }

    @GetMapping("/assets/charts-*.js")
    public String forwardHashedChartsScript() {
        return "forward:/assets/charts.js";
    }
}
