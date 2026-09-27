package in.supplybase.backend.partner;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.partner.dto.ApplyAsPartnerRequest;
import in.supplybase.backend.partner.dto.PartnerDetailResponse;
import in.supplybase.backend.partner.dto.PartnerProfileResponse;
import in.supplybase.backend.partner.dto.PartnerSummaryResponse;
import in.supplybase.backend.partner.dto.UpdatePartnerStatusRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
public class PartnerController {

    private final PartnerService service;
    private final CurrentUser currentUser;

    public PartnerController(PartnerService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    /* ------------------------------------------------------------ partner */

    /**
     * Public. Creates the login and a PENDING application, and signs the new
     * partner straight in so they land on their "under review" page.
     */
    @PostMapping("/api/partners/apply")
    public ResponseEntity<AuthResponse> apply(@Valid @RequestBody ApplyAsPartnerRequest request,
                                              HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.apply(request, httpRequest.getRemoteAddr()));
    }

    /** The signed-in user's own application. 404 if they never applied. */
    @GetMapping("/api/partners/me")
    public PartnerProfileResponse me() {
        return service.myProfile(currentUser.require().id());
    }

    /* -------------------------------------------------------------- admin */

    @GetMapping("/api/admin/partners")
    public Page<PartnerSummaryResponse> list(@RequestParam(required = false) PartnerStatus status,
                                             @RequestParam(required = false) String q,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return service.list(status, q,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/api/admin/partners/counts")
    public Map<PartnerStatus, Long> counts() {
        return service.counts();
    }

    @GetMapping("/api/admin/partners/{userId}")
    public PartnerDetailResponse detail(@PathVariable Long userId) {
        return service.detail(userId);
    }

    @PatchMapping("/api/admin/partners/{userId}/status")
    public PartnerDetailResponse review(@PathVariable Long userId,
                                        @Valid @RequestBody UpdatePartnerStatusRequest request) {
        return service.review(userId, request.status(), request.note(), currentUser.require().id());
    }
}
