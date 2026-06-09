package com.subastas.service;

import com.subastas.dto.request.LoginRequest;
import com.subastas.dto.request.RegistroPostorPaso1Request;
import com.subastas.dto.request.RegistroPostorPaso2Request;
import com.subastas.dto.response.ActivacionResponse;
import com.subastas.dto.response.LoginResponse;
import com.subastas.dto.response.RegistroResponse;
import com.subastas.entity.Cliente;
import com.subastas.entity.Duenio;
import com.subastas.entity.Pais;
import com.subastas.entity.Persona;
import com.subastas.entity.RefreshToken;
import com.subastas.entity.TokenActivacion;
import com.subastas.entity.enums.CategoriaCliente;
import com.subastas.entity.enums.EstadoPersona;
import com.subastas.exception.BusinessException;
import com.subastas.exception.ForbiddenException;
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.exception.UnauthorizedException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PaisRepository;
import com.subastas.repository.PersonaRepository;
import com.subastas.repository.RefreshTokenRepository;
import com.subastas.repository.TokenActivacionRepository;
import com.subastas.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final ClienteRepository clienteRepository;
    private final PersonaRepository personaRepository;
    private final PaisRepository paisRepository;
    private final TokenActivacionRepository tokenActivacionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Transactional
    public RegistroResponse registrarPaso1(RegistroPostorPaso1Request request) {
        if (personaRepository.existsByDocumento(request.documento())) {
            throw new BusinessException("Ya existe un usuario registrado con el documento: " + request.documento());
        }

        Pais pais = paisRepository.findById(request.paisId().longValue())
                .orElseThrow(() -> new ResourceNotFoundException("Pais", "id", request.paisId()));

        Persona persona;
        if ("duenio".equalsIgnoreCase(request.tipoUsuario()) || "vendedor".equalsIgnoreCase(request.tipoUsuario())) {
            Duenio duenio = new Duenio();
            duenio.setVerificacionFinanciera("aprobado");
            duenio.setVerificacionJudicial("aprobado");
            persona = duenio;
        } else {
            Cliente cliente = new Cliente();
            cliente.setPais(pais);
            cliente.setAdmitido("no"); // pending validation
            cliente.setCategoria(CategoriaCliente.comun);
            persona = cliente;
        }

        persona.setDocumento(request.documento());
        persona.setNombre(request.nombre());
        persona.setApellido(request.apellido());
        persona.setDireccion(request.direccion());
        persona.setEstado(EstadoPersona.activo);
        persona.setPassword(passwordEncoder.encode(request.password()));

        Persona saved = personaRepository.save(persona);
        log.info("Registro completado para documento: {}, tipo: {}, id: {}", 
                request.documento(), request.tipoUsuario(), saved.getId());

        return new RegistroResponse(
                saved.getId(),
                "COMPLETADO",
                "Usuario registrado con éxito."
        );
    }

    @Transactional
    public ActivacionResponse registrarPaso2(RegistroPostorPaso2Request request) {
        TokenActivacion tokenActivacion = tokenActivacionRepository
                .findByTokenAndUsadoFalse(request.tokenActivacion())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Token de activación no encontrado, ya fue usado o es inválido"));

        if (!LocalDateTime.now().isBefore(tokenActivacion.getExpiraEn())) {
            throw new BusinessException("El token de activación ha expirado. Solicitá uno nuevo.");
        }

        Cliente cliente = (Cliente) tokenActivacion.getUsuario();
        cliente.setPassword(passwordEncoder.encode(request.password()));
        clienteRepository.save(cliente);

        tokenActivacion.setUsado(true);
        tokenActivacionRepository.save(tokenActivacion);

        log.info("Cuenta activada para usuario id: {}", cliente.getId());

        // TODO: replace documento with real email field when added to DB schema
        emailService.enviarActivacionCuenta(
                cliente.getDocumento(),
                cliente.getNombre(),
                request.tokenActivacion()
        );

        return new ActivacionResponse(
                cliente.getId(),
                cliente.getCategoria().name(),
                "Cuenta activada. Ya podés registrar tus medios de pago."
        );
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Persona persona = personaRepository.findByDocumento(request.documento())
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        if (persona.getPassword() == null || !passwordEncoder.matches(request.password(), persona.getPassword())) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        if (persona.getEstado() != EstadoPersona.activo) {
            throw new ForbiddenException("Cuenta suspendida");
        }

        String categoria = null;
        String admitido = "si";

        if (persona.getDocumento() != null && persona.getDocumento().equals("1")) {
            categoria = "admin";
            if (persona instanceof Cliente cliente) {
                admitido = cliente.getAdmitido();
            }
        } else if (persona instanceof Cliente cliente) {
            categoria = cliente.getCategoria().name();
            admitido = cliente.getAdmitido();
        } else if (persona instanceof Duenio) {
            categoria = "vendedor";
        }

        String accessToken = jwtUtil.generateAccessToken(persona);
        String refreshTokenStr = jwtUtil.generateRefreshToken(persona.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(persona);
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setExpiraEn(LocalDateTime.now().plusDays(7));
        refreshToken.setInvalidado(false);
        refreshTokenRepository.save(refreshToken);

        log.info("Login exitoso para usuario id: {}, documento: {}", persona.getId(), persona.getDocumento());

        return new LoginResponse(accessToken, refreshTokenStr, persona.getId(), persona.getNombre(), persona.getApellido(), categoria, admitido);
    }

    @Transactional
    public void logout(Long usuarioId) {
        int count = refreshTokenRepository.invalidarTodosDelUsuario(usuarioId);
        log.info("Logout: {} refresh token(s) invalidado(s) para usuario id: {}", count, usuarioId);
    }
}
