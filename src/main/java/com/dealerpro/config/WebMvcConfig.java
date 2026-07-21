package com.dealerpro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Ensures React's static assets (JS, CSS, images) are served correctly.
     * The SpaController handles HTML routing; this handles the asset files.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/");

        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/static/");

        registry.addResourceHandler("/*.js", "/*.css", "/*.ico", "/*.json", "/*.png", "/*.svg")
                .addResourceLocations("classpath:/static/");
    }
}
