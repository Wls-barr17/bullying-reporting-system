package edu.umb.bullyblock.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountDetailsService implements UserDetailsService {
    private final AccountRepository accounts;
    public AccountDetailsService(AccountRepository accounts) { this.accounts = accounts; }
    @Override public UserDetails loadUserByUsername(String username) {
        return accounts.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciales inválidas."));
    }
}
