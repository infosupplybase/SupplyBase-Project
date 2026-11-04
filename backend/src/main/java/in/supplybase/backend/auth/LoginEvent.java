package in.supplybase.backend.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One successful sign-in. Feeds the admin's "logins today / this week" numbers. */
@Entity
@Table(name = "login_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginEvent {

    public enum Method { PASSWORD, GOOGLE, SIGNUP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Method method;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
