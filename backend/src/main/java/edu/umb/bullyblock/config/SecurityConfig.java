package edu.umb.bullyblock.config;

import edu.umb.bullyblock.auth.AccountRepository;
import edu.umb.bullyblock.auth.AccountRole;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Set;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AccountRepository accounts) throws Exception {
        var csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);
        http
            .cors(Customizer.withDefaults())
            // Keep CSRF protection enabled for browser sessions; the React client reads this cookie and echoes its token.
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(csrfHandler))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/register", "/api/health", "/actuator/health").permitAll()
                    .requestMatchers("/api/auth/session", "/api/auth/logout").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/cases").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/cases/track").permitAll()
                    .requestMatchers("/api/admin/accounts/**").access((authentication, context) ->
                            new AuthorizationDecision(hasCurrentRole(authentication.get(), accounts, Set.of(AccountRole.ADMIN))))
                    .requestMatchers("/api/admin/**").access((authentication, context) ->
                            new AuthorizationDecision(hasCurrentRole(authentication.get(), accounts, Set.of(AccountRole.SUPPORT, AccountRole.ADMIN))))
                    .anyRequest().authenticated())
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .exceptionHandling(errors -> errors
                    .authenticationEntryPoint((request, response, exception) -> {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                        response.getWriter().write("{\"title\":\"Autenticación requerida\",\"status\":401,\"detail\":\"Inicia sesión para continuar.\"}");
                    }));
        return http.build();
    }

    private boolean hasCurrentRole(org.springframework.security.core.Authentication authentication,
                                   AccountRepository accounts, Set<AccountRole> allowedRoles) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        Object principal = authentication.getPrincipal();
        String email = principal instanceof org.springframework.security.core.userdetails.UserDetails details
                ? details.getUsername() : null;
        return email != null && accounts.findByEmailIgnoreCase(email)
                .map(account -> allowedRoles.contains(account.getRole())).orElse(false);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origin}") String allowedOrigin) {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
