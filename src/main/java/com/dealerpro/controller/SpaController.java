package com.dealerpro.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static routes to React's index.html
 * so that React Router handles client-side navigation.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
            "/", "/login", "/register", "/dashboard", "/stock/**",
            "/transactions/**", "/payments/**",
            "/replacements/**", "/scrap/**", "/reports/**", "/users/**"
    })
    public String forwardToReact(HttpServletRequest request) {
        return "forward:/index.html";
    }
}
