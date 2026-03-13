package com.mycargonaut.backend.config;

import com.mycargonaut.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.mycargonaut.backend.repository.CargonautRepository cargonautRepository;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use /topic to broadcast messages
        config.enableSimpleBroker("/topic");
        // Use /app for messages bound for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint that clients will use to connect
        registry.addEndpoint("/ws/tracking")
                .setAllowedOrigins("http://localhost:4200") // Frontend origin
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add a security interceptor to extract JWT from CONNECT frame
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        String userEmail = jwtService.extractUsername(token);
                        
                        if (userEmail != null) {
                            com.mycargonaut.backend.model.Cargonaut cargonaut = cargonautRepository.findByEmail(userEmail).orElse(null);
                            
                            if (cargonaut != null && jwtService.isTokenValid(token, cargonaut.getEmail())) {
                            
                                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder().username(cargonaut.getEmail()).password(cargonaut.getPasswort()).authorities(java.util.Collections.emptyList()).build();
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(authentication);
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}

