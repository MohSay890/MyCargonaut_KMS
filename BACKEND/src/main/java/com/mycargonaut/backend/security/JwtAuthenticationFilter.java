package com.mycargonaut.backend.security;

import com.mycargonaut.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Header auslesen
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Prüfen: Ist ein Header da und fängt er mit "Bearer " an?
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Token extrahieren (alles nach "Bearer ")
        jwt = authHeader.substring(7);
        // Email aus dem Token lesen
        userEmail = jwtService.extractUsername(jwt);

        // 4. Falls Email da ist und User noch nicht authentifiziert ist
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // User aus der Datenbank laden
            var userEntity = userRepository.findByPrimaryEmail(userEmail).orElse(null);

            if (userEntity != null && jwtService.isTokenValid(jwt, userEntity.getPrimaryEmail())) {

                // Spring Security "User" Objekt erstellen (Adapter)
                UserDetails userDetails = new User(
                        userEntity.getPrimaryEmail(),
                        userEntity.getPasswordHash(),
                        Collections.emptyList() // Hier könnten später Rollen rein
                );

                // 5. Authentifizierung setzen (Der User ist jetzt offiziell "drin")
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Weiter zur nächsten Station
        filterChain.doFilter(request, response);
    }
}
