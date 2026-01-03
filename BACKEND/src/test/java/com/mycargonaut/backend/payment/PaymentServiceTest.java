package com.mycargonaut.backend.payment;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.PaymentRepository;
import com.mycargonaut.backend.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Cargonaut testUser;
    private Fahrt testFahrt;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new Cargonaut();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setVorname("Max");
        testUser.setNachname("Mustermann");

        // Setup test fahrt
        testFahrt = new Fahrt();
        testFahrt.setId(1L);
        testFahrt.setStartOrt("Berlin");
        testFahrt.setZielOrt("Munich");
        testFahrt.setFahrer(testUser); // Set driver to satisfy validation

        // Setup test payment
        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setFahrt(testFahrt);
        testPayment.setPayer(testUser);
        testPayment.setAmount(new BigDecimal("50.00"));
        testPayment.setCurrency("EUR");
        testPayment.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        testPayment.setStatus(PaymentStatus.PENDING);
        testPayment.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testCreatePayment_Success() {
        // Given
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        // When
        Payment created = paymentService.createPayment(
                testFahrt,
                testUser,
                new BigDecimal("50.00"),
                "EUR",
                PaymentMethod.CREDIT_CARD
        );

        // Then
        assertNotNull(created);
        assertEquals(PaymentStatus.PENDING, created.getStatus());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void testCreatePayment_NullAmount() {
        // When/Then
        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.createPayment(testFahrt, testUser, null, "EUR", PaymentMethod.CREDIT_CARD);
        });
    }

    @Test
    void testCreatePayment_NegativeAmount() {
        // When/Then
        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.createPayment(testFahrt, testUser, new BigDecimal("-10.00"), "EUR", PaymentMethod.CREDIT_CARD);
        });
    }

    @Test
    void testProcessPayment_Success() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        // When
        Payment processed = paymentService.processPayment(1L);

        // Then
        assertNotNull(processed);
        verify(paymentRepository, atLeast(2)).save(any(Payment.class));
    }

    @Test
    void testProcessPayment_NotFound() {
        // Given
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(RuntimeException.class, () -> {
            paymentService.processPayment(999L);
        });
    }

    @Test
    void testProcessPayment_NotPending() {
        // Given
        testPayment.setStatus(PaymentStatus.COMPLETED);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When/Then
        assertThrows(IllegalStateException.class, () -> {
            paymentService.processPayment(1L);
        });
    }

    @Test
    void testGetPaymentById_Success() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When
        Optional<Payment> found = paymentService.getPaymentById(1L);

        // Then
        assertTrue(found.isPresent());
        assertEquals(1L, found.get().getId());
    }

    @Test
    void testGetPaymentById_NotFound() {
        // Given
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<Payment> found = paymentService.getPaymentById(999L);

        // Then
        assertFalse(found.isPresent());
    }

    @Test
    void testGetPaymentsByUser() {
        // Given
        List<Payment> payments = Arrays.asList(testPayment);
        when(paymentRepository.findByPayerIdOrderByCreatedAtDesc(1L)).thenReturn(payments);

        // When
        List<Payment> found = paymentService.getPaymentsByUser(1L);

        // Then
        assertNotNull(found);
        assertEquals(1, found.size());
        assertEquals(testPayment.getId(), found.get(0).getId());
    }

    @Test
    void testGetPaymentsByFahrt() {
        // Given
        List<Payment> payments = Arrays.asList(testPayment);
        when(paymentRepository.findByFahrtIdOrderByCreatedAtDesc(1L)).thenReturn(payments);

        // When
        List<Payment> found = paymentService.getPaymentsByFahrt(1L);

        // Then
        assertNotNull(found);
        assertEquals(1, found.size());
        assertEquals(testPayment.getId(), found.get(0).getId());
    }

    @Test
    void testGetPaymentsByStatus() {
        // Given
        List<Payment> payments = Arrays.asList(testPayment);
        when(paymentRepository.findByStatus(PaymentStatus.PENDING)).thenReturn(payments);

        // When
        List<Payment> found = paymentService.getPaymentsByStatus(PaymentStatus.PENDING);

        // Then
        assertNotNull(found);
        assertEquals(1, found.size());
        assertEquals(PaymentStatus.PENDING, found.get(0).getStatus());
    }

    @Test
    void testRefundPayment_Success() {
        // Given
        testPayment.setStatus(PaymentStatus.COMPLETED);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        // When
        Payment refunded = paymentService.refundPayment(1L);

        // Then
        assertNotNull(refunded);
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void testRefundPayment_NotCompleted() {
        // Given
        testPayment.setStatus(PaymentStatus.PENDING);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When/Then
        assertThrows(IllegalStateException.class, () -> {
            paymentService.refundPayment(1L);
        });
    }

    @Test
    void testRefundPayment_NotFound() {
        // Given
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(RuntimeException.class, () -> {
            paymentService.refundPayment(999L);
        });
    }
}
