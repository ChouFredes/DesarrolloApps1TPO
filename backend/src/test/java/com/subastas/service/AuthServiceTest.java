package com.subastas.service;

import com.subastas.dto.request.LoginRequest;
import com.subastas.dto.request.RegistroPostorPaso1Request;
import com.subastas.dto.response.LoginResponse;
import com.subastas.dto.response.RegistroResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Pais;
import com.subastas.entity.Persona;
import com.subastas.entity.RefreshToken;
import com.subastas.entity.TokenActivacion;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.UnauthorizedException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PaisRepository;
import com.subastas.repository.PersonaRepository;
import com.subastas.repository.RefreshTokenRepository;
import com.subastas.repository.TokenActivacionRepository;
import com.subastas.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    private PersonaRepository personaRepository;

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
                "foto_frente.jpg", "foto_dorso.jpg", "Pokeball1!", "cliente"
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

        when(personaRepository.existsByDocumento("12345678")).thenReturn(true);

        assertThrows(BusinessException.class, () -> authService.registrarPaso1(request));

        verify(personaRepository, never()).save(any());
    }

    @Test
    void registrarPaso1_exitoso_retornaPendienteAprobacion() {
        RegistroPostorPaso1Request request = buildPaso1Request("87654321");

        Pais pais = new Pais();
        pais.setId(1L);

        Cliente savedCliente = buildCliente("87654321", EstadoPersona.pendiente, "no",
                null, "encoded_pass");

        when(personaRepository.existsByDocumento("87654321")).thenReturn(false);
        when(paisRepository.findById(1L)).thenReturn(Optional.of(pais));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_pass");
        when(personaRepository.save(any(Persona.class))).thenReturn(savedCliente);

        RegistroResponse response = authService.registrarPaso1(request);

        assertNotNull(response);
        assertEquals("PENDIENTE_APROBACION", response.estado());
        assertEquals(1L, response.usuarioId());
        verify(personaRepository).save(any(Persona.class));
    }

    @Test
    void registrarPaso1_exitoso_personaGuardadaConPassword() {
        RegistroPostorPaso1Request request = buildPaso1Request("11223344");

        Pais pais = new Pais();
        pais.setId(1L);

        Cliente savedCliente = buildCliente("11223344", EstadoPersona.pendiente, "no",
                null, "encoded_pass");

        when(personaRepository.existsByDocumento("11223344")).thenReturn(false);
        when(paisRepository.findById(1L)).thenReturn(Optional.of(pais));
        when(passwordEncoder.encode("Pokeball1!")).thenReturn("encoded_pass");
        when(personaRepository.save(any(Persona.class))).thenReturn(savedCliente);

        ArgumentCaptor<Persona> personaCaptor = ArgumentCaptor.forClass(Persona.class);

        authService.registrarPaso1(request);

        verify(personaRepository).save(personaCaptor.capture());
        Persona captured = personaCaptor.getValue();
        assertEquals(EstadoPersona.pendiente, captured.getEstado());
        assertEquals("encoded_pass", captured.getPassword());
    }

    // -----------------------------------------------------------------------
    // login tests
    // -----------------------------------------------------------------------

    @Test
    void login_credencialesInvalidas_lanzaUnauthorizedException() {
        LoginRequest request = new LoginRequest("12345678", "wrongPassword");

        Cliente cliente = buildCliente("12345678", EstadoPersona.activo, "si",
                CategoriaCliente.comun, "$2a$12$hashedpassword");

        when(personaRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches("wrongPassword", "$2a$12$hashedpassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));

        verify(jwtUtil, never()).generateAccessToken(any());
    }

    @Test
    void login_usuarioInactivo_lanzaForbiddenException() {
        LoginRequest request = new LoginRequest("12345678", "correctPassword");

        Cliente cliente = buildCliente("12345678", EstadoPersona.inactivo, "si",
                CategoriaCliente.comun, "$2a$12$hashedpassword");

        when(personaRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
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

        when(personaRepository.findByDocumento("12345678")).thenReturn(Optional.of(cliente));
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

    @Test
    void login_clienteConCategoriaNula_noLanzaExcepcionYRetornaCategoriaNull() {
        LoginRequest request = new LoginRequest("99887766", "correctPassword");

        // Cliente activo, admitido, pero sin categoria asignada aún
        Cliente cliente = buildCliente("99887766", EstadoPersona.activo, "si",
                null, "$2a$12$hashedpassword");

        when(personaRepository.findByDocumento("99887766")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches("correctPassword", "$2a$12$hashedpassword")).thenReturn(true);
        when(jwtUtil.generateAccessToken(cliente)).thenReturn("access-token-null-cat");
        when(jwtUtil.generateRefreshToken(1L)).thenReturn("refresh-token-null-cat");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Must not throw NullPointerException
        LoginResponse response = assertDoesNotThrow(() -> authService.login(request));

        assertNotNull(response);
        assertNull(response.categoria());
        assertEquals("si", response.admitido());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }
}
