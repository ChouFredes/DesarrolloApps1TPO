package com.subastas.service;

import com.subastas.dto.request.LoginRequest;
import com.subastas.dto.request.RegistroPostorPaso1Request;
import com.subastas.dto.response.LoginResponse;
import com.subastas.dto.response.RegistroResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Pais;
import com.subastas.entity.RefreshToken;
import com.subastas.entity.TokenActivacion;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.UnauthorizedException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PaisRepository;
import com.subastas.repository.RefreshTokenRepository;
import com.subastas.repository.TokenActivacionRepository;
import com.subastas.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private PaisRepository paisRepository;

    @Mock
    private TokenActivacionRepository tokenActivacionRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private RegistroPostorPaso1Request buildPaso1Request(String documento) {
        return new RegistroPostorPaso1Request(
                documento, "Juan", "Perez", "Calle 123", 1,
                "foto_frente.jpg", "foto_dorso.jpg"
        );
    }

    private Cliente buildCliente(String documento, EstadoPersona estado, String admitido,
                                  CategoriaCliente categoria, String password) {
        Cliente c = new Cliente();
        c.setId(1L);
        c.setDocumento(documento);
        c.setNombre("Juan");
        c.setApellido("Perez");
        c.setEstado(estado);
        c.setAdmitido(admitido);
        c.setCategoria(categoria);
        c.setPassword(password);
        return c;
    }

    // -----------------------------------------------------------------------
    // registrarPaso1 tests
    // -----------------------------------------------------------------------

    @Test
    void registrarPaso1_documentoYaExiste_lanzaBusinessException() {
        RegistroPostorPaso1Request request = buildPaso1Request("12345678");

        when(clienteRepository.existsByDocumento("12345678")).thenReturn(true);

        assertThrows(BusinessException.class, () -> authService.registrarPaso1(request));

        verify(clienteRepository, never()).save(any());
    }

    @Test
    void registrarPaso1_exitoso_retornaRegistroResponseConEstadoPendiente() {
        RegistroPostorPaso1Request request = buildPaso1Request("87654321");

        Pais pais = new Pais();
        pais.setId(1L);

        Cliente savedCliente = buildCliente("87654321", EstadoPersona.activo, "no",
                CategoriaCliente.comun, null);

        when(clienteRepository.existsByDocumento("87654321")).thenReturn(false);
        when(paisRepository.findById(1L)).thenReturn(Optional.of(pais));
        when(clienteRepository.save(any(Cliente.class))).thenReturn(savedCliente);
        when(tokenActivacionRepository.save(any(TokenActivacion.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).enviarConfirmacionRegistro(anyString(), anyString());

        RegistroResponse response = authService.registrarPaso1(request);

        assertNotNull(response);
        assertEquals("PENDIENTE_VERIFICACION", response.estado());
        assertEquals(1L, response.usuarioId());
        verify(tokenActivacionRepository).save(any(TokenActivacion.class));
        verify(emailService).enviarConfirmacionRegistro(anyString(), eq("Juan"));
    }

    // -----------------------------------------------------------------------
    // login tests
    // -----------------------------------------------------------------------

    @Test
    void login_credencialesInvalidas_lanzaUnauthorizedException() {
        LoginRequest request = new LoginRequest("12345678", "wrongPassword");

        Cliente cliente = buildCliente("12345678", EstadoPersona.activo, "si",
                CategoriaCliente.comun, "$2a$12$hashedpassword");

        when(clienteRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches("wrongPassword", "$2a$12$hashedpassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));

        verify(jwtUtil, never()).generateAccessToken(any());
    }

    @Test
    void login_usuarioInactivo_lanzaForbiddenException() {
        LoginRequest request = new LoginRequest("12345678", "correctPassword");

        Cliente cliente = buildCliente("12345678", EstadoPersona.inactivo, "si",
                CategoriaCliente.comun, "$2a$12$hashedpassword");

        when(clienteRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches("correctPassword", "$2a$12$hashedpassword")).thenReturn(true);

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> authService.login(request));

        assertTrue(ex.getMessage().contains("suspendida") || ex.getMessage().contains("suspend"));
        verify(jwtUtil, never()).generateAccessToken(any());
    }

    @Test
    void login_exitoso_retornaLoginResponseConToken() {
        LoginRequest request = new LoginRequest("12345678", "correctPassword");

        Cliente cliente = buildCliente("12345678", EstadoPersona.activo, "si",
                CategoriaCliente.comun, "$2a$12$hashedpassword");

        when(clienteRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches("correctPassword", "$2a$12$hashedpassword")).thenReturn(true);
        when(jwtUtil.generateAccessToken(cliente)).thenReturn("access-token-xyz");
        when(jwtUtil.generateRefreshToken(1L)).thenReturn("refresh-token-xyz");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.accessToken());
        assertEquals("access-token-xyz", response.accessToken());
        assertEquals("refresh-token-xyz", response.refreshToken());
        assertEquals(1L, response.usuarioId());
        assertEquals("comun", response.categoria());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }
}
