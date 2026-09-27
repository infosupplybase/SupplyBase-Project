package in.supplybase.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;

/**
 * Creates the very first ADMIN account on startup, so a fresh deployment is
 * never stuck locked out of everything behind {@code /api/admin/**} with no
 * way in.
 *
 * Does nothing once any ADMIN already exists, and does nothing at all unless
 * both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are set — this is
 * entirely opt-in.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder, AppProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.countByRole(Role.ADMIN) > 0) {
            return;
        }
        if (!props.bootstrap().configured()) {
            return;
        }

        String email = props.bootstrap().adminEmail().trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email).orElse(null);

        if (user != null) {
            user.setRole(Role.ADMIN);
            users.save(user);
            log.info("Bootstrap: promoted existing user {} to ADMIN", email);
            return;
        }

        User created = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(props.bootstrap().adminPassword()))
                .fullName("Admin")
                .role(Role.ADMIN)
                .enabled(true)
                .emailVerified(true)
                .build();
        users.save(created);
        log.info("Bootstrap: created ADMIN user {}", email);
    }
}
