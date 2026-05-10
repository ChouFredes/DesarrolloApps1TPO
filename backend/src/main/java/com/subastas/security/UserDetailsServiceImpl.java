package com.subastas.security;

import com.subastas.entity.Persona;
import com.subastas.repository.PersonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final PersonaRepository personaRepository;

    @Override
    public UserDetails loadUserByUsername(String documento) throws UsernameNotFoundException {
        Persona persona = personaRepository.findByDocumento(documento)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado con documento: " + documento));
        return new User(
                persona.getDocumento(),
                persona.getPassword() != null ? persona.getPassword() : "",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
