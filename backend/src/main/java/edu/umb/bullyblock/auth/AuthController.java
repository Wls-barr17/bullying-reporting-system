package edu.umb.bullyblock.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final String bootstrapAdminEmail;

    public AuthController(AccountRepository accounts, PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          @Value("${APP_BOOTSTRAP_ADMIN_EMAIL:}") String bootstrapAdminEmail) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.bootstrapAdminEmail = bootstrapAdminEmail.strip().toLowerCase(Locale.ROOT);
    }

    public record Credentials(@NotBlank @Size(max = 120) String name,
                              @NotBlank @Email @Size(max = 180) String email,
                              @NotBlank @Size(min = 12, max = 72) String password) { }
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
    public record AccountView(Long id, String name, String email, AccountRole role, String profileImage) {
        static AccountView from(Account account) {
            return new AccountView(account.getId(), account.getName(), account.getEmail(), account.getRole(), account.getProfileImage());
        }
    }
    public record ProfileRequest(@NotBlank @Size(max = 120) String name,
                                 @Size(max = 2_800_000) String profileImage) { }

    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) { return Map.of("token", token.getToken()); }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AccountView register(@Valid @RequestBody Credentials credentials, HttpServletRequest request) {
        String normalizedEmail = credentials.email().strip().toLowerCase(Locale.ROOT);
        if (!bootstrapAdminEmail.isEmpty() && bootstrapAdminEmail.equals(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo está reservado para la cuenta institucional inicial.");
        }
        if (credentials.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña no puede superar 72 bytes UTF-8.");
        }
        if (accounts.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo ya está registrado.");
        }
        Account account = accounts.save(new Account(credentials.name().strip(), normalizedEmail,
                passwordEncoder.encode(credentials.password())));
        authenticate(normalizedEmail, credentials.password(), request);
        return AccountView.from(account);
    }

    @PostMapping("/login")
    AccountView login(@Valid @RequestBody LoginRequest credentials, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        credentials.email().strip().toLowerCase(Locale.ROOT), credentials.password()));
        persistAuthentication(authentication, request);
        return AccountView.from((Account) authentication.getPrincipal());
    }

    @GetMapping("/session")
    AccountView session(Authentication authentication) {
        return AccountView.from((Account) authentication.getPrincipal());
    }

    @PatchMapping("/profile")
    AccountView updateProfile(@Valid @RequestBody ProfileRequest request,
                              @org.springframework.security.core.annotation.AuthenticationPrincipal Account account) {
        String image = request.profileImage();
        if (image != null && !image.isBlank() && !image.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usa una imagen PNG, JPG o WebP válida.");
        }
        account.updateProfile(request.name().strip(), image == null || image.isBlank() ? null : image);
        return AccountView.from(accounts.save(account));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    private void authenticate(String email, String password, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, password));
        persistAuthentication(authentication, request);
    }

    private void persistAuthentication(Authentication authentication, HttpServletRequest request) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true);
        // Rotate the session identifier after authentication to mitigate session fixation.
        request.changeSessionId();
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}
