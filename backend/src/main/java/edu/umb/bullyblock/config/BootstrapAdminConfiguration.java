package edu.umb.bullyblock.config;

import edu.umb.bullyblock.auth.Account;
import edu.umb.bullyblock.auth.AccountRepository;
import edu.umb.bullyblock.auth.AccountRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
public class BootstrapAdminConfiguration {
    @Bean
    ApplicationRunner bootstrapAdmin(AccountRepository accounts, PasswordEncoder encoder,
                                     @Value("${APP_BOOTSTRAP_ADMIN_EMAIL:}") String configuredEmail,
                                     @Value("${APP_BOOTSTRAP_ADMIN_PASSWORD:}") String configuredPassword) {
        return arguments -> {
            String email = configuredEmail.strip().toLowerCase(Locale.ROOT);
            String password = configuredPassword;
            if (email.isEmpty() && password.isEmpty()) return;
            if (email.isEmpty() || password.isEmpty()) {
                throw new IllegalStateException("Configure tanto APP_BOOTSTRAP_ADMIN_EMAIL como APP_BOOTSTRAP_ADMIN_PASSWORD.");
            }
            if (password.length() < 20 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException("La contraseña inicial de administrador debe tener entre 20 y 72 bytes.");
            }
            var existing = accounts.findByEmailIgnoreCase(email);
            if (existing.isPresent()) {
                if (existing.get().getRole() != AccountRole.ADMIN) {
                    throw new IllegalStateException("El correo de administrador inicial ya pertenece a una cuenta sin rol ADMIN.");
                }
                return;
            }
            String name = "Administración UMB";
            Account admin = new Account(name, email, encoder.encode(password));
            admin.changeRole(AccountRole.ADMIN);
            accounts.save(admin);
        };
    }
}
