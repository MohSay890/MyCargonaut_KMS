package com.mycargonaut.backend.security;

import com.mycargonaut.backend.model.Cargonaut; // Nutzt jetzt die offizielle Entity
import com.mycargonaut.backend.repository.CargonautRepository; // Nutzt das neue Repository
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CargonautRepository cargonautRepository; // Repository angepasst

    public JwtAuthenticationFilter(JwtService jwtService, CargonautRepository cargonautRepository) {
        this.jwtService = jwtService;
        this.cargonautRepository = cargonautRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Suche über das Feld 'email' laut UML
            Cargonaut cargonaut = cargonautRepository.findByEmail(userEmail).orElse(null);

            if (cargonaut != null && jwtService.isTokenValid(jwt, cargonaut.getEmail())) {

                // Wir nutzen hier den Spring Security User als "Adapter"
                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(cargonaut.getEmail())
                        .password(cargonaut.getPasswort()) // Feldname 'passwort' laut UML
                        .authorities(Collections.emptyList())
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
