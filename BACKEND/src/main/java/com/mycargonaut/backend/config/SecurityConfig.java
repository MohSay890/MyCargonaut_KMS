package com.mycargonaut.backend.config;

import com.mycargonaut.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            // WICHTIG: Erlaubt Frames für die H2-Konsole
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                 .requestMatchers("/", "/h2-console/**").permitAll()
                 .requestMatchers("/api/health", "/actuator/**", "/api/auth/**").permitAll()

                 // WICHTIG: Erlaube explizit POST-Anfragen für Buchungen
                 .requestMatchers(HttpMethod.POST, "/api/fahrten/buchungen").permitAll()
                 .requestMatchers("/api/fahrten/**").permitAll()

                 // Falls dein Controller unter /api/buchungen läuft, füge auch das hinzu:
                 .requestMatchers("/api/buchungen/**").permitAll()

                 .requestMatchers("/api/requests/**", "/api/request-offers/**").permitAll()
                 .requestMatchers("/api/fahrzeuge/**", "/api/profile/**").permitAll()
                 .requestMatchers("/api/payments/**", "/api/tracking/**").permitAll()
                 // Erlaubt sowohl /api/bewertungen als auch /api/bewertungen/123
                 .requestMatchers("/api/bewertungen", "/api/bewertungen/**").permitAll()
                 .requestMatchers("/api/notifications/**").permitAll()
                 .anyRequest().authenticated()
             )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Dein Frontend
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); // POST muss dabei sein!
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
