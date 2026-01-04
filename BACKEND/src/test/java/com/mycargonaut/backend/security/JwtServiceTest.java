package com.mycargonaut.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private String testEmail;
    private String testToken;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        testEmail = "test@example.com";
    }

    // ==================== TOKEN GENERATION TESTS ====================

    @Test
    void testGenerateToken_Success() {
        // When
        String token = jwtService.generateToken(testEmail);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts separated by dots
    }

    @Test
    void testGenerateToken_DifferentUsersGetDifferentTokens() {
        // When
        String token1 = jwtService.generateToken("user1@example.com");
        String token2 = jwtService.generateToken("user2@example.com");

        // Then
        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2);
    }

    @Test
    void testGenerateToken_ConsecutiveCallsGenerateDifferentTokens() {
        // When - Generate tokens for the same user at different times
        String token1 = jwtService.generateToken(testEmail);
        try {
            Thread.sleep(1100); // Sleep longer than 1 second to ensure different timestamps
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String token2 = jwtService.generateToken(testEmail);

        // Then
        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2); // Different because of different issuedAt timestamps
    }

    @Test
    void testGenerateToken_WithEmptyEmail() {
        // When
        String token = jwtService.generateToken("");

        // Then
        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3);
    }

    // ==================== TOKEN EXTRACTION TESTS ====================

    @Test
    void testExtractUsername_Success() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When
        String extractedEmail = jwtService.extractUsername(testToken);

        // Then
        assertEquals(testEmail, extractedEmail);
    }

    @Test
    void testExtractUsername_MultipleUsers() {
        // Given
        String email1 = "user1@example.com";
        String email2 = "user2@example.com";
        String token1 = jwtService.generateToken(email1);
        String token2 = jwtService.generateToken(email2);

        // When
        String extracted1 = jwtService.extractUsername(token1);
        String extracted2 = jwtService.extractUsername(token2);

        // Then
        assertEquals(email1, extracted1);
        assertEquals(email2, extracted2);
    }

    @Test
    void testExtractUsername_FromOldToken() {
        // Given - Generate a token and extract username later
        testToken = jwtService.generateToken(testEmail);
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        String extractedEmail = jwtService.extractUsername(testToken);

        // Then
        assertEquals(testEmail, extractedEmail);
    }

    // ==================== TOKEN VALIDATION TESTS ====================

    @Test
    void testIsTokenValid_ValidToken() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When
        boolean isValid = jwtService.isTokenValid(testToken, testEmail);

        // Then
        assertTrue(isValid);
    }

    @Test
    void testIsTokenValid_WrongUsername() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When
        boolean isValid = jwtService.isTokenValid(testToken, "wrong@example.com");

        // Then
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_TokenBelongsToDifferentUser() {
        // Given
        String email1 = "user1@example.com";
        String email2 = "user2@example.com";
        String token1 = jwtService.generateToken(email1);

        // When
        boolean isValid = jwtService.isTokenValid(token1, email2);

        // Then
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_EmptyUsername() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When
        boolean isValid = jwtService.isTokenValid(testToken, "");

        // Then
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_NullUsername() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When
        boolean isValid = jwtService.isTokenValid(testToken, null);

        // Then
        assertFalse(isValid);
    }

    // ==================== TOKEN EXPIRATION TESTS ====================

    @Test
    void testToken_NotExpiredImmediately() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When - Check immediately after generation
        boolean isValid = jwtService.isTokenValid(testToken, testEmail);

        // Then
        assertTrue(isValid);
    }

    @Test
    void testToken_StillValidAfterShortTime() {
        // Given
        testToken = jwtService.generateToken(testEmail);

        // When - Wait a short time and check
        try {
            Thread.sleep(1000); // 1 second
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        boolean isValid = jwtService.isTokenValid(testToken, testEmail);

        // Then
        assertTrue(isValid);
    }

    // ==================== TOKEN FORMAT TESTS ====================

    @Test
    void testToken_HasCorrectFormat() {
        // When
        testToken = jwtService.generateToken(testEmail);

        // Then
        String[] parts = testToken.split("\\.");
        assertEquals(3, parts.length, "JWT should have 3 parts: header.payload.signature");
        assertTrue(parts[0].length() > 0, "Header should not be empty");
        assertTrue(parts[1].length() > 0, "Payload should not be empty");
        assertTrue(parts[2].length() > 0, "Signature should not be empty");
    }

    @Test
    void testToken_StartsWithCorrectPrefix() {
        // When
        testToken = jwtService.generateToken(testEmail);

        // Then
        // JWT tokens start with base64 encoded header which typically starts with "eyJ"
        assertTrue(testToken.startsWith("eyJ"));
    }

    // ==================== EDGE CASE TESTS ====================

    @Test
    void testGenerateToken_WithSpecialCharactersInEmail() {
        // Given
        String specialEmail = "test+special@example.com";

        // When
        String token = jwtService.generateToken(specialEmail);
        String extracted = jwtService.extractUsername(token);

        // Then
        assertNotNull(token);
        assertEquals(specialEmail, extracted);
    }

    @Test
    void testGenerateToken_WithLongEmail() {
        // Given
        String longEmail = "very.long.email.address.with.many.dots@example.com";

        // When
        String token = jwtService.generateToken(longEmail);
        String extracted = jwtService.extractUsername(token);

        // Then
        assertNotNull(token);
        assertEquals(longEmail, extracted);
    }

    @Test
    void testGenerateToken_WithUnicodeCharacters() {
        // Given
        String unicodeEmail = "tëst@éxämplë.com";

        // When
        String token = jwtService.generateToken(unicodeEmail);
        String extracted = jwtService.extractUsername(token);

        // Then
        assertNotNull(token);
        assertEquals(unicodeEmail, extracted);
    }

    @Test
    void testRoundTrip_GenerateAndValidate() {
        // Given
        String[] testEmails = {
                "user1@example.com",
                "user2@example.com",
                "admin@company.org",
                "test+tag@domain.co.uk"
        };

        for (String email : testEmails) {
            // When
            String token = jwtService.generateToken(email);
            String extracted = jwtService.extractUsername(token);
            boolean isValid = jwtService.isTokenValid(token, email);

            // Then
            assertEquals(email, extracted, "Extracted email should match original for: " + email);
            assertTrue(isValid, "Token should be valid for: " + email);
        }
    }
}
