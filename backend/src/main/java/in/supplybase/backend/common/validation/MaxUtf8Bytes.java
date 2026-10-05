package in.supplybase.backend.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Caps a string by its UTF-8 byte length rather than its character count.
 *
 * BCrypt's limit is 72 bytes, not 72 characters: "é" is two bytes, so 40 of
 * them pass a @Size(max = 72) check and then make the encoder throw, which
 * surfaced as a 500. Null is valid; pair with @NotBlank where it is required.
 */
@Documented
@Constraint(validatedBy = MaxUtf8BytesValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface MaxUtf8Bytes {

    int value();

    String message() default "That is too long";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
