package in.supplybase.backend.partner;

import java.time.Instant;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.AuthService;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingRepository;
import in.supplybase.backend.booking.BookingRepository.PartnerJobCount;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.dto.PartnerEarningsResponse;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.catalogue.ServiceCategoryRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.FileStorageService;
import in.supplybase.backend.partner.dto.ApplyAsPartnerRequest;
import in.supplybase.backend.partner.dto.ApplyWithAccountRequest;
import in.supplybase.backend.partner.dto.PartnerDetailResponse;
import in.supplybase.backend.partner.dto.PartnerJobResponse;
import in.supplybase.backend.partner.dto.PartnerProfileResponse;
import in.supplybase.backend.partner.dto.PartnerSummaryResponse;

/**
 * Partner (professional) applications and the admin's decisions on them.
 *
 * The rule that matters: the PROFESSIONAL role is only ever granted here, by
 * an admin approving an application. {@link #apply} creates an ordinary
 * CUSTOMER account, and {@link #review} keeps users.role in step with the
 * application's status, so the role can never be claimed by signing up.
 */
@Service
public class PartnerService {

    /**
     * Who can move where. An approved partner is suspended rather than
     * "rejected", and a suspended or rejected one can be approved again —
     * but nobody goes back to PENDING, which only means "not yet looked at".
     */
    private static final Map<PartnerStatus, Set<PartnerStatus>> ALLOWED_MOVES = Map.of(
            PartnerStatus.PENDING, Set.of(PartnerStatus.APPROVED, PartnerStatus.REJECTED),
            PartnerStatus.APPROVED, Set.of(PartnerStatus.SUSPENDED),
            PartnerStatus.SUSPENDED, Set.of(PartnerStatus.APPROVED),
            PartnerStatus.REJECTED, Set.of(PartnerStatus.APPROVED));

    private final PartnerProfileRepository partners;
    private final UserRepository users;
    private final BookingRepository bookings;
    private final ServiceCategoryRepository categories;
    private final AuthService authService;
    private final FileStorageService files;

    public PartnerService(PartnerProfileRepository partners, UserRepository users,
                          BookingRepository bookings, ServiceCategoryRepository categories,
                          AuthService authService, FileStorageService files) {
        this.partners = partners;
        this.users = users;
        this.bookings = bookings;
        this.categories = categories;
        this.authService = authService;
        this.files = files;
    }

    /* ------------------------------------------------------------ partner */

    /**
     * Creates the login and a PENDING application together, so a failure in
     * either leaves nothing behind. Sign-up rate limiting, duplicate email and
     * phone checks all come from {@link AuthService#register}.
     *
     * The Aadhaar and PAN photos are stored under partners/{userId}/documents
     * in the private uploads folder; only their storage keys go on the profile.
     */
    @Transactional
    public AuthResponse apply(ApplyAsPartnerRequest request, PartnerDocuments documents, String clientIp) {
        String trade = requireTrade(request.primaryTrade());
        // Checked before the account is created so a bad trade, or a file
        // that is not a photo, never costs anyone a sign-up attempt.
        documents.requirePhotos();

        AuthResponse auth = authService.register(
                new RegisterRequest(request.fullName(), request.email(), request.phone(), request.password()),
                clientIp);

        saveApplication(users.getReferenceById(auth.user().id()), trade, request.experienceYears(),
                request.city(), request.serviceAreas(), request.languages(), documents);
        return auth;
    }

    /**
     * A signed-in customer applying on the account they already have. Applying
     * through {@link #apply} would try to create a second account with the same
     * email and phone and be refused, so this attaches a PENDING application to
     * the existing login instead. The role stays CUSTOMER until an admin
     * approves it, exactly as for a new applicant.
     */
    @Transactional
    public PartnerProfileResponse applyWithAccount(Long userId, ApplyWithAccountRequest request,
                                                   PartnerDocuments documents) {
        String trade = requireTrade(request.primaryTrade());
        documents.requirePhotos();

        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.notFound("That account"));
        if (user.getRole() != Role.CUSTOMER) {
            throw ApiException.badRequest("This account cannot apply as a partner.");
        }
        if (partners.findByUserId(userId).isPresent()) {
            throw ApiException.conflict("You have already applied. Your application is on your dashboard.");
        }

        PartnerProfile profile = saveApplication(user, trade, request.experienceYears(), request.city(),
                request.serviceAreas(), request.languages(), documents);
        return PartnerProfileResponse.from(profile, tradeLabels().get(profile.getPrimaryTrade()));
    }

    /** The trade slug, if it is one of the top-level services customers can book. */
    private String requireTrade(String primaryTrade) {
        String trade = primaryTrade.trim();
        categories.findBySlugAndActiveTrue(trade)
                .filter(category -> category.getParentSlug() == null)
                .orElseThrow(() -> ApiException.badRequest("Please choose one of the listed trades."));
        return trade;
    }

    /**
     * Stores the Aadhaar and PAN photos under partners/{userId}/documents in the
     * private uploads folder and saves a PENDING application pointing at them.
     */
    private PartnerProfile saveApplication(User user, String trade, Integer experienceYears, String city,
                                           String serviceAreas, String languages, PartnerDocuments documents) {
        String folder = "partners/" + user.getId() + "/documents";
        return partners.save(PartnerProfile.builder()
                .user(user)
                .primaryTrade(trade)
                .experienceYears(experienceYears)
                .city(city.trim())
                .serviceAreas(blankToNull(serviceAreas))
                .languages(blankToNull(languages))
                .aadhaarFrontPath(files.store(documents.aadhaarFront(), folder).storageKey())
                .aadhaarBackPath(files.store(documents.aadhaarBack(), folder).storageKey())
                .panFrontPath(files.store(documents.panFront(), folder).storageKey())
                .status(PartnerStatus.PENDING)
                .build());
    }

    /** The signed-in user's own application, or 404 if they never applied. */
    @Transactional(readOnly = true)
    public PartnerProfileResponse myProfile(Long userId) {
        PartnerProfile profile = partners.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("A partner application for this account"));
        return PartnerProfileResponse.from(profile, tradeLabels().get(profile.getPrimaryTrade()));
    }

    /* -------------------------------------------------------------- admin */

    @Transactional(readOnly = true)
    public Page<PartnerSummaryResponse> list(PartnerStatus status, String q, Pageable pageable) {
        Page<PartnerProfile> page = partners.search(status, blankToNull(q), pageable);
        Map<Long, long[]> counts = jobCounts(page.getContent().stream()
                .map(p -> p.getUser().getId()).toList());
        Map<String, String> labels = tradeLabels();
        return page.map(p -> {
            long[] c = counts.getOrDefault(p.getUser().getId(), new long[] { 0, 0 });
            return PartnerSummaryResponse.from(p, labels.get(p.getPrimaryTrade()), c[0], c[1]);
        });
    }

    @Transactional(readOnly = true)
    public PartnerDetailResponse detail(Long userId) {
        return toDetail(load(userId));
    }

    /** How many partners are in each status — feeds the filter tabs and the overview tile. */
    @Transactional(readOnly = true)
    public Map<PartnerStatus, Long> counts() {
        Map<PartnerStatus, Long> result = new EnumMap<>(PartnerStatus.class);
        for (PartnerStatus s : PartnerStatus.values()) {
            result.put(s, partners.countByStatus(s));
        }
        return result;
    }

    /**
     * An admin's decision. Approving grants the PROFESSIONAL role; rejecting or
     * suspending takes it away again. Jobs already assigned to a suspended
     * partner are left alone — reassigning them is a call for the admin, and
     * the detail response shows how many are still open.
     */
    @Transactional
    public PartnerDetailResponse review(Long userId, PartnerStatus target, String note, Long adminId) {
        if (userId.equals(adminId)) {
            throw ApiException.badRequest("You cannot review your own account.");
        }
        PartnerProfile profile = load(userId);
        User user = profile.getUser();

        if (user.getRole() == Role.ADMIN) {
            throw ApiException.badRequest("An admin account cannot be a partner.");
        }
        if (!ALLOWED_MOVES.getOrDefault(profile.getStatus(), Set.of()).contains(target)) {
            throw ApiException.badRequest("A " + profile.getStatus().name().toLowerCase()
                    + " partner cannot be set to " + target.name().toLowerCase() + ".");
        }
        String cleanNote = blankToNull(note);
        if ((target == PartnerStatus.REJECTED || target == PartnerStatus.SUSPENDED) && cleanNote == null) {
            throw ApiException.badRequest("Please give a reason — the partner will see it.");
        }

        user.setRole(target == PartnerStatus.APPROVED ? Role.PROFESSIONAL : Role.CUSTOMER);
        users.save(user);

        profile.setStatus(target);
        profile.setReviewNote(cleanNote);
        profile.setReviewedBy(adminId);
        profile.setReviewedAt(Instant.now());
        partners.save(profile);

        return toDetail(profile);
    }

    /* ------------------------------------------------------------ helpers */

    private PartnerProfile load(Long userId) {
        return partners.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("That partner"));
    }

    private PartnerDetailResponse toDetail(PartnerProfile profile) {
        Long userId = profile.getUser().getId();
        List<Booking> jobs = bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(userId);
        long active = jobs.stream().filter(b -> !b.getStatus().isFinal()).count();
        long completed = jobs.stream().filter(b -> b.getStatus() == BookingStatus.WORK_COMPLETED).count();
        return PartnerDetailResponse.from(profile, tradeLabels().get(profile.getPrimaryTrade()),
                active, completed, PartnerEarningsResponse.from(jobs, Instant.now()),
                jobs.stream().map(PartnerJobResponse::from).toList());
    }

    /** partnerId -> {active, completed}. Cancelled jobs count as neither. */
    private Map<Long, long[]> jobCounts(List<Long> partnerIds) {
        Map<Long, long[]> result = new HashMap<>();
        if (partnerIds.isEmpty()) {
            return result;
        }
        for (PartnerJobCount row : bookings.countJobsByPartner(partnerIds)) {
            long[] c = result.computeIfAbsent(row.getPartnerId(), id -> new long[] { 0, 0 });
            if (row.getStatus() == BookingStatus.WORK_COMPLETED) {
                c[1] += row.getTotal();
            } else if (!row.getStatus().isFinal()) {
                c[0] += row.getTotal();
            }
        }
        return result;
    }

    /** slug -> display name for every category; a handful of rows, so read them all. */
    private Map<String, String> tradeLabels() {
        return categories.findAllByOrderBySortOrderAsc().stream()
                .collect(Collectors.toMap(ServiceCategory::getSlug, ServiceCategory::getName, (a, b) -> a));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
