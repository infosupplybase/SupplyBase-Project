package in.supplybase.backend.auth;

import java.time.Instant;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

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

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    /**
     * BCrypt hash. Never leaves the server — no DTO exposes this field.
     * Null for an account that has only ever signed in with Google.
     */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /**
     * Google's `sub` claim — stable for the life of the Google account, unlike
     * the email address, which can be changed by its owner.
     */
    @Column(name = "google_sub", unique = true, length = 64)
    private String googleSub;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "picture_url", length = 500)
    private String pictureUrl;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    /**
     * Staff for the purposes of seeing other people's commercial records.
     * A PROFESSIONAL is deliberately NOT included: they see the jobs assigned
     * to them through the assignment, never the whole book of business.
     */
    public boolean isStaff() {
        return role == Role.ADMIN;
    }

    /** A Google-only account cannot sign in with a password it does not have. */
    public boolean hasPassword() {
        return passwordHash != null && !passwordHash.isBlank();
    }
}
