package in.supplybase.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Warns at startup when a public (https) deployment still allows local
 * addresses in CORS_ORIGINS.
 *
 * The development default ("http://localhost:[*],http://127.0.0.1:[*]") lets
 * any program running on a visitor's own computer call this API from the
 * browser with that visitor's sign-in. It is right for a laptop and wrong for
 * the production server, where CORS_ORIGINS should list the public origins
 * only. It only warns - refusing to start would take the site down over a
 * setting, and a local run (an http FRONTEND_URL) is left alone.
 */
@Component
public class CorsOriginsCheck {

    private static final Logger log = LoggerFactory.getLogger(CorsOriginsCheck.class);

    private final AppProperties props;

    public CorsOriginsCheck(AppProperties props) {
        this.props = props;
    }

    /** The allowed origins that point at the visitor's own machine, when this is a public site; else empty. */
    static List<String> localOriginsOnPublicSite(AppProperties props) {
        String frontend = props.frontendUrl() == null ? "" : props.frontendUrl().trim().toLowerCase();
        if (!frontend.startsWith("https://") || props.corsAllowedOrigins() == null) {
            return List.of();
        }
        return props.corsAllowedOrigins().stream()
                .filter(origin -> {
                    String o = origin.toLowerCase();
                    return o.contains("localhost") || o.contains("127.0.0.1") || o.contains("[::1]");
                })
                .toList();
    }

    @EventListener(ApplicationReadyEvent.class)
    void warnAboutLocalOrigins() {
        List<String> local = localOriginsOnPublicSite(props);
        if (!local.isEmpty()) {
            log.warn("CORS_ORIGINS still allows local addresses {} while FRONTEND_URL is a public https site. "
                    + "Set CORS_ORIGINS in backend/.env to the exact public origins only "
                    + "(https://www..., https://admin..., https://partners...) - see DEPLOYMENT.md.", local);
        }
    }
}
