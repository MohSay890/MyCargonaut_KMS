package com.mycargonaut.backend.user;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.user.api.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private CargonautRepository cargonautRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private RegisterRequest testRegisterRequest;
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

    // ==================== REGISTRATION TESTS ====================

    @Test
    void testRegisterUser_Success() {
        // Given
        when(cargonautRepository.findByEmail(testRegisterRequest.primaryEmail()))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode(testRegisterRequest.password()))
                .thenReturn("$2a$10$encodedPassword");
        when(cargonautRepository.save(any(Cargonaut.class)))
                .thenReturn(testCargonaut);

        // When
        Cargonaut result = userService.registerUser(testRegisterRequest);

        // Then
        assertNotNull(result);
        assertEquals("Max", result.getVorname());
        assertEquals("Mustermann", result.getNachname());
        assertEquals("max@example.com", result.getEmail());
        assertEquals("Berlin", result.getStadt());
        assertEquals("10115", result.getPlz());
        verify(cargonautRepository).findByEmail("max@example.com");
        verify(passwordEncoder).encode("SecurePassword123!");
        verify(cargonautRepository).save(any(Cargonaut.class));
    }

    @Test
    void testRegisterUser_EmailAlreadyExists() {
        // Given
        when(cargonautRepository.findByEmail(testRegisterRequest.primaryEmail()))
                .thenReturn(Optional.of(testCargonaut));

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.registerUser(testRegisterRequest);
        });

        assertEquals("Benutzer mit dieser Email existiert bereits.", exception.getMessage());
        verify(cargonautRepository).findByEmail("max@example.com");
        verify(cargonautRepository, never()).save(any(Cargonaut.class));
    }

    @Test
    void testRegisterUser_PasswordIsEncoded() {
        // Given
        when(cargonautRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encodedPassword");
        when(cargonautRepository.save(any(Cargonaut.class))).thenReturn(testCargonaut);

        // When
        userService.registerUser(testRegisterRequest);

        // Then
        verify(passwordEncoder).encode("SecurePassword123!");
    }

    @Test
    void testRegisterUser_AllFieldsAreSaved() {
        // Given
        when(cargonautRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encodedPassword");
        when(cargonautRepository.save(any(Cargonaut.class))).thenAnswer(invocation -> {
            Cargonaut saved = invocation.getArgument(0);
            // Verify all fields are set correctly
            assertEquals("Max", saved.getVorname());
            assertEquals("Mustermann", saved.getNachname());
            assertEquals("max@example.com", saved.getEmail());
            assertEquals(LocalDate.of(1990, 5, 15), saved.getGeburtsdatum());
            assertEquals("$2a$10$encodedPassword", saved.getPasswort());
            assertEquals("Berlin", saved.getStadt());
            assertEquals("10115", saved.getPlz());
            return saved;
        });

        // When
        userService.registerUser(testRegisterRequest);

        // Then
        verify(cargonautRepository).save(any(Cargonaut.class));
    }

    @Test
    void testRegisterUser_WithMinimalData() {
        // Given - registration with only required fields
        RegisterRequest minimalRequest = new RegisterRequest(
                "John",
                "Doe",
                "john@example.com",
                null,
                "password123",
                LocalDate.of(1995, 1, 1),
                "0176123456",
                null,
                null
        );

        Cargonaut minimalCargonaut = new Cargonaut();
        minimalCargonaut.setId(2L);
        minimalCargonaut.setVorname("John");
        minimalCargonaut.setNachname("Doe");
        minimalCargonaut.setEmail("john@example.com");

        when(cargonautRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");
        when(cargonautRepository.save(any(Cargonaut.class))).thenReturn(minimalCargonaut);

        // When
        Cargonaut result = userService.registerUser(minimalRequest);

        // Then
        assertNotNull(result);
        assertEquals("John", result.getVorname());
        assertEquals("Doe", result.getNachname());
        verify(cargonautRepository).save(any(Cargonaut.class));
    }

    // ==================== LOGIN TESTS ====================

    @Test
    void testLoginUser_Success() {
        // Given
        when(cargonautRepository.findByEmail("max@example.com"))
                .thenReturn(Optional.of(testCargonaut));
        when(passwordEncoder.matches("SecurePassword123!", "$2a$10$encodedPassword"))
                .thenReturn(true);

        // When
        Cargonaut result = userService.loginUser("max@example.com", "SecurePassword123!");

        // Then
        assertNotNull(result);
        assertEquals("max@example.com", result.getEmail());
        assertEquals("Max", result.getVorname());
        assertEquals("Mustermann", result.getNachname());
        verify(cargonautRepository).findByEmail("max@example.com");
        verify(passwordEncoder).matches("SecurePassword123!", "$2a$10$encodedPassword");
    }

    @Test
    void testLoginUser_UserNotFound() {
        // Given
        when(cargonautRepository.findByEmail("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("nonexistent@example.com", "password");
        });

        assertEquals("Benutzer nicht gefunden.", exception.getMessage());
        verify(cargonautRepository).findByEmail("nonexistent@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void testLoginUser_WrongPassword() {
        // Given
        when(cargonautRepository.findByEmail("max@example.com"))
                .thenReturn(Optional.of(testCargonaut));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$encodedPassword"))
                .thenReturn(false);

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("max@example.com", "WrongPassword");
        });

        assertEquals("Falsches Passwort!", exception.getMessage());
        verify(cargonautRepository).findByEmail("max@example.com");
        verify(passwordEncoder).matches("WrongPassword", "$2a$10$encodedPassword");
    }

    @Test
    void testLoginUser_EmailIsCaseInsensitive() {
        // Given
        when(cargonautRepository.findByEmail("MAX@EXAMPLE.COM"))
                .thenReturn(Optional.of(testCargonaut));
        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(true);

        // When
        Cargonaut result = userService.loginUser("MAX@EXAMPLE.COM", "SecurePassword123!");

        // Then
        assertNotNull(result);
        verify(cargonautRepository).findByEmail("MAX@EXAMPLE.COM");
    }

    @Test
    void testLoginUser_EmptyEmail() {
        // Given
        when(cargonautRepository.findByEmail(""))
                .thenReturn(Optional.empty());

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("", "password");
        });

        assertEquals("Benutzer nicht gefunden.", exception.getMessage());
    }

    @Test
    void testLoginUser_NullPassword() {
        // Given
        when(cargonautRepository.findByEmail("max@example.com"))
                .thenReturn(Optional.of(testCargonaut));
        when(passwordEncoder.matches(null, "$2a$10$encodedPassword"))
                .thenReturn(false);

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("max@example.com", null);
        });

        assertEquals("Falsches Passwort!", exception.getMessage());
    }

    @Test
    void testLoginUser_MultipleFailedAttempts() {
        // Given
        when(cargonautRepository.findByEmail("max@example.com"))
                .thenReturn(Optional.of(testCargonaut));
        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(false);

        // When/Then - Simulate 3 failed login attempts
        RuntimeException exception1 = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("max@example.com", "WrongPassword0");
        });
        assertEquals("Falsches Passwort!", exception1.getMessage());

        RuntimeException exception2 = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("max@example.com", "WrongPassword1");
        });
        assertEquals("Falsches Passwort!", exception2.getMessage());

        RuntimeException exception3 = assertThrows(RuntimeException.class, () -> {
            userService.loginUser("max@example.com", "WrongPassword2");
        });
        assertEquals("Falsches Passwort!", exception3.getMessage());

        // Verify repository was called 3 times
        verify(cargonautRepository, times(3)).findByEmail("max@example.com");
        verify(passwordEncoder, times(3)).matches(anyString(), anyString());
    }
}
