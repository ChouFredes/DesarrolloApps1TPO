package com.subastas.config;

import com.subastas.entity.Foto;
import com.subastas.entity.Producto;
import com.subastas.entity.Subasta;
import com.subastas.repository.FotoRepository;
import com.subastas.repository.ProductoRepository;
import com.subastas.repository.SubastaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseInitializer {

    private final SubastaRepository subastaRepository;
    private final ProductoRepository productoRepository;
    private final FotoRepository fotoRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        log.info("Iniciando carga dinamica de imagenes desde el sistema de archivos...");
        try {
            // El backend suele ejecutarse desde el directorio /backend, subimos un nivel para buscar las carpetas de recursos.
            File baseDir = new File("..");
            if (!new File(baseDir, "Pokeballs").exists()) {
                // Si por alguna razon corre desde la raiz del proyecto
                baseDir = new File(".");
            }
            log.info("Directorio base seleccionado para buscar imagenes: {}", baseDir.getAbsolutePath());

            // 1. Cargar portadas de subastas
            cargarPortada(1L, new File(baseDir, "Pokeballs/portada.png"));
            cargarPortada(2L, new File(baseDir, "Stones/portada.png"));
            cargarPortada(3L, new File(baseDir, "Xmove/portada.png"));
            cargarPortada(4L, new File(baseDir, "berry/portada.png"));
            cargarPortada(5L, new File(baseDir, "items/portada.png"));

            // 2. Cargar fotos de productos (si no tienen fotos cargadas aun)
            // Subasta 1: Pokeballs (IDs 1-5)
            cargarFotoProducto(1L, new File(baseDir, "Pokeballs/pokeball.png"));
            cargarFotoProducto(2L, new File(baseDir, "Pokeballs/greatball.png"));
            cargarFotoProducto(3L, new File(baseDir, "Pokeballs/ultraball.png"));
            cargarFotoProducto(4L, new File(baseDir, "Pokeballs/safariball.png"));
            cargarFotoProducto(5L, new File(baseDir, "Pokeballs/masterball.png"));

            // Subasta 2: Stones (IDs 6-10)
            cargarFotoProducto(6L, new File(baseDir, "Stones/firestone.png"));
            cargarFotoProducto(7L, new File(baseDir, "Stones/leafstone.png"));
            cargarFotoProducto(8L, new File(baseDir, "Stones/moonstone.png"));
            cargarFotoProducto(9L, new File(baseDir, "Stones/thunderstone.png"));
            cargarFotoProducto(10L, new File(baseDir, "Stones/waterstone.png"));

            // Subasta 3: Xmove (IDs 11-14)
            cargarFotoProducto(11L, new File(baseDir, "Xmove/xattack.png"));
            cargarFotoProducto(12L, new File(baseDir, "Xmove/xdefense.png"));
            cargarFotoProducto(13L, new File(baseDir, "Xmove/xsp.atk.png"));
            cargarFotoProducto(14L, new File(baseDir, "Xmove/xspeed.png"));

            // Subasta 4: Berry (IDs 15-19)
            cargarFotoProducto(15L, new File(baseDir, "berry/blukberry.png"));
            cargarFotoProducto(16L, new File(baseDir, "berry/chestoberry.png"));
            cargarFotoProducto(17L, new File(baseDir, "berry/liechiberry.png"));
            cargarFotoProducto(18L, new File(baseDir, "berry/nanabberry.png"));
            cargarFotoProducto(19L, new File(baseDir, "berry/petayaberry.png"));

            // Subasta 5: Items (IDs 20-24)
            cargarFotoProducto(20L, new File(baseDir, "items/amuletcoin.png"));
            cargarFotoProducto(21L, new File(baseDir, "items/leftovers.png"));
            cargarFotoProducto(22L, new File(baseDir, "items/magnet.png"));
            cargarFotoProducto(23L, new File(baseDir, "items/never-meltice.png"));
            cargarFotoProducto(24L, new File(baseDir, "items/twistedspoon.png"));

            log.info("Carga dinamica de imagenes completada con exito.");
        } catch (Exception e) {
            log.error("Error al cargar imagenes dinamicamente: ", e);
        }
    }

    private void cargarPortada(Long subastaId, File file) {
        if (!file.exists()) {
            log.warn("Archivo de portada no encontrado: {}", file.getAbsolutePath());
            return;
        }
        subastaRepository.findById(subastaId).ifPresent(s -> {
            try {
                byte[] bytes = Files.readAllBytes(file.toPath());
                s.setFotoPortada(bytes);
                subastaRepository.save(s);
                log.info("Portada cargada para subasta ID: {} ({} bytes)", subastaId, bytes.length);
            } catch (Exception e) {
                log.error("Error al leer archivo de portada para subasta {}: {}", subastaId, e.getMessage());
            }
        });
    }

    private void cargarFotoProducto(Long productoId, File file) {
        if (!file.exists()) {
            log.warn("Archivo de foto de producto no encontrado: {}", file.getAbsolutePath());
            return;
        }
        productoRepository.findById(productoId).ifPresent(p -> {
            List<Foto> fotosExistentes = fotoRepository.findByProductoId(productoId);
            if (fotosExistentes.isEmpty()) {
                try {
                    byte[] bytes = Files.readAllBytes(file.toPath());
                    Foto foto = new Foto();
                    foto.setProducto(p);
                    foto.setFoto(bytes);
                    fotoRepository.save(foto);
                    log.info("Foto cargada para producto ID: {} ({} bytes)", productoId, bytes.length);
                } catch (Exception e) {
                    log.error("Error al leer foto para producto {}: {}", productoId, e.getMessage());
                }
            }
        });
    }
}
