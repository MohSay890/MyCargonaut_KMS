package com.mycargonaut.backend.user.api;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.security.JwtService;
import com.mycargonaut.backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest testRegisterRequest;
    private LoginRequest testLoginRequest;
    private Cargonaut testCargonaut;

    @BeforeEach
    void setUp() {
        // Setup test registration request
        testRegisterRequest = new RegisterRequest(
                "Max",
                "Mustermann",
                "max@example.com",
                "max.alt@example.com",
                "SecurePassword123!",
                LocalDate.of(1990, 5, 15),
                "0176123456",
                "Berlin",
                "10115"
        );

        // Setup test login request
        testLoginRequest = new LoginRequest(
                "max@example.com",
                "SecurePassword123!"
        );

        // Setup test cargonaut
        testCargonaut = new Cargonaut();
        testCargonaut.setId(1L);
        testCargonaut.setVorname("Max");
        testCargonaut.setNachname("Mustermann");
        testCargonaut.setEmail("max@example.com");
        testCargonaut.setGeburtsdatum(LocalDate.of(1990, 5, 15));
        testCargonaut.setPasswort("$2a$10$encodedPassword");
        testCargonaut.setStadt("Berlin");
        testCargonaut.setPlz("10115");
    }

    // ==================== REGISTRATION ENDPOINT TESTS ====================

    @Test
    void testRegister_Success() {
        // Given
        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(testCargonaut);

        // When
        ResponseEntity<?> response = authController.register(testRegisterRequest);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        // Response body is a RegisterResponse record with id, message, email
        assertTrue(response.getBody().toString().contains("Cargonaut erfolgreich registriert"));
        verify(userService).registerUser(any(RegisterRequest.class));
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Given
        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Benutzer mit dieser Email existiert bereits."));

        // When
        ResponseEntity<?> response = authController.register(testRegisterRequest);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Benutzer mit dieser Email existiert bereits.", response.getBody());
        verify(userService).registerUser(any(RegisterRequest.class));
    }

    @Test
    void testRegister_WithInvalidData() {
        // Given
        RegisterRequest invalidRequest = new RegisterRequest(
                null,  // Missing first name
                "Mustermann",
                "max@example.com",
                null,
                "password",
                LocalDate.of(1990, 5, 15),
                "0176123456",
                "Berlin",
                "10115"
        );

        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Vorname darf nicht leer sein."));

        // When
        ResponseEntity<?> response = authController.register(invalidRequest);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Vorname darf nicht leer sein."));
    }

    @Test
    void testRegister_DatabaseError() {
        // Given
        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Datenbankfehler"));

        // When
        ResponseEntity<?> response = authController.register(testRegisterRequest);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Datenbankfehler", response.getBody());
    }

    @Test
    void testRegister_ReturnsCorrectUserId() {
        // Given
        testCargonaut.setId(42L);
        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(testCargonaut);

        // When
        ResponseEntity<?> response = authController.register(testRegisterRequest);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("42"));
    }

    // ==================== LOGIN ENDPOINT TESTS ====================

    @Test
    void testLogin_Success() {
        // Given
        String expectedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
        when(userService.loginUser(testLoginRequest.primaryEmail(), testLoginRequest.password()))
                .thenReturn(testCargonaut);
        when(jwtService.generateToken(testCargonaut.getEmail()))
                .thenReturn(expectedToken);

        // When
        ResponseEntity<?> response = authController.login(testLoginRequest);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof LoginResponse);
        LoginResponse loginResponse = (LoginResponse) response.getBody();
        assertEquals(expectedToken, loginResponse.token());
        verify(userService).loginUser("max@example.com", "SecurePassword123!");
        verify(jwtService).generateToken("max@example.com");
    }

    @Test
    void testLogin_UserNotFound() {
        // Given
        when(userService.loginUser(anyString(), anyString()))
                .thenThrow(new RuntimeException("Benutzer nicht gefunden."));

        // When
        ResponseEntity<?> response = authController.login(testLoginRequest);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Benutzer nicht gefunden.", response.getBody());
        verify(userService).loginUser("max@example.com", "SecurePassword123!");
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void testLogin_WrongPassword() {
        // Given
        when(userService.loginUser(anyString(), anyString()))
                .thenThrow(new RuntimeException("Falsches Passwort!"));

        // When
        ResponseEntity<?> response = authController.login(testLoginRequest);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Falsches Passwort!", response.getBody());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void testLogin_EmptyEmail() {
        // Given
        LoginRequest emptyEmailRequest = new LoginRequest("", "password");
        when(userService.loginUser("", "password"))
                .thenThrow(new RuntimeException("Benutzer nicht gefunden."));

        // When
        ResponseEntity<?> response = authController.login(emptyEmailRequest);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testLogin_EmptyPassword() {
        // Given
        LoginRequest emptyPasswordRequest = new LoginRequest("max@example.com", "");
        when(userService.loginUser("max@example.com", ""))
                .thenThrow(new RuntimeException("Falsches Passwort!"));

        // When
        ResponseEntity<?> response = authController.login(emptyPasswordRequest);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testLogin_TokenIsGenerated() {
        // Given
        String expectedToken = "valid.jwt.token";
        when(userService.loginUser(anyString(), anyString())).thenReturn(testCargonaut);
        when(jwtService.generateToken(anyString())).thenReturn(expectedToken);

        // When
        ResponseEntity<?> response = authController.login(testLoginRequest);

        // Then
        LoginResponse loginResponse = (LoginResponse) response.getBody();
        assertNotNull(loginResponse);
        assertEquals(expectedToken, loginResponse.token());
        verify(jwtService).generateToken("max@example.com");
    }

    @Test
    void testLogin_TokenGenerationError() {
        // Given
        when(userService.loginUser(anyString(), anyString())).thenReturn(testCargonaut);
        when(jwtService.generateToken(anyString()))
                .thenThrow(new RuntimeException("Token generation failed"));

        // When
        ResponseEntity<?> response = authController.login(testLoginRequest);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Token generation failed", response.getBody());
    }

    @Test
    void testLogin_MultipleSuccessfulLogins() {
        // Given
        when(userService.loginUser(anyString(), anyString())).thenReturn(testCargonaut);
        when(jwtService.generateToken(anyString())).thenReturn("token1", "token2", "token3");

        // When - Simulate 3 successful logins
        ResponseEntity<?> response1 = authController.login(testLoginRequest);
        ResponseEntity<?> response2 = authController.login(testLoginRequest);
        ResponseEntity<?> response3 = authController.login(testLoginRequest);

        // Then
        assertEquals(HttpStatus.OK, response1.getStatusCode());
        assertEquals(HttpStatus.OK, response2.getStatusCode());
        assertEquals(HttpStatus.OK, response3.getStatusCode());

        LoginResponse loginResponse1 = (LoginResponse) response1.getBody();
        LoginResponse loginResponse2 = (LoginResponse) response2.getBody();
        LoginResponse loginResponse3 = (LoginResponse) response3.getBody();

        assertEquals("token1", loginResponse1.token());
        assertEquals("token2", loginResponse2.token());
        assertEquals("token3", loginResponse3.token());

        verify(userService, times(3)).loginUser(anyString(), anyString());
        verify(jwtService, times(3)).generateToken(anyString());
    }

    @Test
    void testLogin_CorrectEmailIsUsedForTokenGeneration() {
        // Given
        when(userService.loginUser(anyString(), anyString())).thenReturn(testCargonaut);
        when(jwtService.generateToken("max@example.com")).thenReturn("token");

        // When
        authController.login(testLoginRequest);

        // Then
        verify(jwtService).generateToken("max@example.com");
    }
}
