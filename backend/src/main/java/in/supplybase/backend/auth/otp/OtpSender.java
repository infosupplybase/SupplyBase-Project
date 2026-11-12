package in.supplybase.backend.auth.otp;

/** Delivers a one-time login code to a phone. One implementation: {@link TwoFactorSmsClient}. */
public interface OtpSender {

    /** False when no provider key is set, so OTP login is switched off. */
    boolean configured();

    /** @return true if the provider accepted the message */
    boolean send(String nationalPhone, String code);
}
