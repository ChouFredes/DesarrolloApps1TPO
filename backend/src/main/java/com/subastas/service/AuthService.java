package com.subastas.service;

import com.subastas.dto.request.LoginRequest;
import com.subastas.dto.request.RegistroPostorPaso1Request;
import com.subastas.dto.request.RegistroPostorPaso2Request;
import com.subastas.dto.response.ActivacionResponse;
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
import com.subastas.exception.ResourceNotFoundException;
import com.subastas.exception.UnauthorizedException;
import com.subastas.repository.ClienteRepository;
import com.subastas.repository.PaisRepository;
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
    private final PaisRepository paisRepository;
    private final TokenActivacionRepository tokenActivacionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Transactional
    public RegistroResponse registrarPaso1(RegistroPostorPaso1Request request) {
        if (clienteRepository.existsByDocumento(request.documento())) {
            throw new BusinessException("Ya existe un usuario registrado con el documento: " + request.documento());
        }

        Pais pais = paisRepository.findById(request.paisId().longValue())
                .orElseThrow(() -> new ResourceNotFoundException("Pais", "id", request.paisId()));

        Cliente cliente = new Cliente();
        cliente.setDocumento(request.documento());
        cliente.setNombre(request.nombre());
        cliente.setApellido(request.apellido());
        cliente.setDireccion(request.direccion());
        cliente.setPais(pais);
        cliente.setAdmitido("no");
        cliente.setEstado(EstadoPersona.activo);
        cliente.setCategoria(CategoriaCliente.comun);

        Cliente saved = clienteRepository.save(cliente);
        log.info("Registro paso 1 completado para documento: {}, id: {}", request.documento(), saved.getId());

        // TODO: replace documento with real email field when added to DB schema
        emailService.enviarConfirmacionRegistro(saved.getDocumento(), saved.getNombre());

        TokenActivacion tokenActivacion = new TokenActivacion();
        tokenActivacion.setUsuario(saved);
        tokenActivacion.setToken(UUID.randomUUID().toString());
        tokenActivacion.setExpiraEn(LocalDateTime.now().plusHours(24));
        tokenActivacion.setUsado(false);
        tokenActivacionRepository.save(tokenActivacion);

        return new RegistroResponse(
                saved.getId(),
                "PENDIENTE_VERIFICACION",
                "Tu solicitud está siendo verificada. Recibirás tu token de activación una vez aprobada."
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
        Cliente cliente = clienteRepository.findByDocumento(request.documento())
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        if (cliente.getPassword() == null || !passwordEncoder.matches(request.password(), cliente.getPassword())) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        if (cliente.getEstado() != EstadoPersona.activo) {
            throw new ForbiddenException("Cuenta suspendida");
        }

        if (!"si".equalsIgnoreCase(cliente.getAdmitido())) {
            throw new ForbiddenException("Cuenta pendiente de verificación");
        }

        String accessToken = jwtUtil.generateAccessToken(cliente);
        String refreshTokenStr = jwtUtil.generateRefreshToken(cliente.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(cliente);
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setExpiraEn(LocalDateTime.now().plusDays(7));
        refreshToken.setInvalidado(false);
        refreshTokenRepository.save(refreshToken);

        log.info("Login exitoso para usuario id: {}, documento: {}", cliente.getId(), cliente.getDocumento());

        return new LoginResponse(accessToken, refreshTokenStr, cliente.getId(), cliente.getNombre(), cliente.getApellido(), cliente.getCategoria().name());
    }

    @Transactional
    public void logout(Long usuarioId) {
        int count = refreshTokenRepository.invalidarTodosDelUsuario(usuarioId);
        log.info("Logout: {} refresh token(s) invalidado(s) para usuario id: {}", count, usuarioId);
    }
}
