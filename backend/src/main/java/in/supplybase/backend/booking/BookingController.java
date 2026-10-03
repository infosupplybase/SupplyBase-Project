package in.supplybase.backend.booking;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.booking.dto.AdvanceBookingStatusRequest;
import in.supplybase.backend.booking.dto.AssignProfessionalRequest;
import in.supplybase.backend.booking.dto.BookingFileResponse;
import in.supplybase.backend.booking.dto.BookingReceipt;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.CreateBookingRequest;
import in.supplybase.backend.booking.dto.PartnerEarningsResponse;
import in.supplybase.backend.booking.dto.PartnerPayoutResponse;
import in.supplybase.backend.booking.dto.ProfessionalBookingResponse;
import in.supplybase.backend.booking.dto.SetPartnerPayoutRequest;
import in.supplybase.backend.booking.dto.UpdateBookingRequest;
import in.supplybase.backend.booking.dto.UpdateMyBookingRequest;
import jakarta.validation.Valid;

@RestController
public class BookingController {

    private final BookingService service;
    private final CurrentUser currentUser;

    public BookingController(BookingService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    /**
     * The booking wizard posts here. Signing in is required (SecurityConfig):
     * every booking belongs to an account, so it shows on that customer's
     * dashboard and nobody can book anonymously. The website asks the
     * customer to sign in at the last step, keeping what they typed.
     */
    @PostMapping("/api/bookings")
    public ResponseEntity<BookingReceipt> create(
            @Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request, currentUser.require().id()));
    }

    /** A signed-in client's own bookings, for the dashboard. */
    @GetMapping("/api/bookings/mine")
    public List<BookingResponse> mine() {
        return service.myBookings(currentUser.require().id());
    }

    /**
     * One booking in full — the dashboard's "view booking" page. Staff, or
     * the client who made it; anyone else gets a 404 (see
     * BookingService.checkAccess).
     */
  @GetMapping("/api/bookings/{id}")
public BookingResponse get(@PathVariable("id") Long id) {
    return service.get(id, currentUser.require());
}

    /**
     * A customer editing their own booking's contact details or address —
     * not the service items, which are locked in at booking time. Same
     * owner-or-staff check as get() (see BookingService.checkAccess).
     */
    @PatchMapping("/api/bookings/{id}")
    public BookingResponse updateMine(@PathVariable("id") Long id,
            @Valid @RequestBody UpdateMyBookingRequest request) {
        return service.updateMine(id, request, currentUser.require());
    }

    @GetMapping("/api/bookings/{id}/files")
    public List<BookingFileResponse> files(@PathVariable("id") Long id) {
        return service.listFiles(id, currentUser.require());
    }

    /**
     * The booking wizard's photo upload, as the signed-in customer who made the
     * booking - keyed by the booking NUMBER (what BookingReceipt actually
     * hands back), see {@link BookingService#uploadOwnFile}. {@code phone} and
     * {@code kind} are still accepted because earlier website builds send
     * them, but are no longer used.
     */
    @PostMapping(value = "/api/bookings/by-number/{bookingNumber}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookingFileResponse> uploadOwnFile(@PathVariable("bookingNumber") String bookingNumber,
            @RequestParam(name = "phone", required = false) String phone,
            @RequestParam(name = "kind", required = false) String kind,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.uploadOwnFile(bookingNumber, currentUser.require(), file));
    }

    @GetMapping("/api/bookings/{id}/files/{fileId}/download")
   public ResponseEntity<byte[]> downloadFile(
        @PathVariable("id") Long id,
        @PathVariable("fileId") Long fileId) {
        var file = service.downloadFile(id, fileId, currentUser.require());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        file.contentType() != null ? file.contentType() : "application/octet-stream"))
                .header("Content-Disposition", ContentDisposition.attachment()
                        .filename(file.filename(), StandardCharsets.UTF_8).build().toString())
                .body(file.content());
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/bookings")
    public Page<BookingResponse> list(@RequestParam(required = false) BookingStatus status,
                                      @RequestParam(required = false) BookingType type,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.list(status, type, PageRequest.of(page, Math.min(size, 100)));
    }

    /** The day sheet: every visit requested for one date, in slot order. */
    @GetMapping("/api/admin/bookings/day")
    public List<BookingResponse> forDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.forDate(date);
    }

    @PatchMapping("/api/admin/bookings/{id}")
    public BookingResponse update(@PathVariable("id") Long id,
                                  @Valid @RequestBody UpdateBookingRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/api/admin/bookings/{id}/assign")
    public BookingResponse assign(@PathVariable("id") Long id,
                                  @Valid @RequestBody AssignProfessionalRequest request) {
        return service.assignProfessional(id, request.professionalId());
    }

    /** What the assigned partner earns for this job and whether it has been paid. Admin only. */
    @GetMapping("/api/admin/bookings/{id}/payout")
    public PartnerPayoutResponse partnerPayout(@PathVariable("id") Long id) {
        return service.partnerPayout(id);
    }

    @PatchMapping("/api/admin/bookings/{id}/payout")
    public PartnerPayoutResponse setPartnerPayout(@PathVariable("id") Long id,
                                                  @Valid @RequestBody SetPartnerPayoutRequest request) {
        return service.setPartnerPayout(id, request.amountPaise(), request.paid());
    }

    @PostMapping(value = "/api/admin/bookings/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookingFileResponse> uploadFile(
        @PathVariable("id") Long id,
            @RequestParam(defaultValue = "PHOTO") String kind,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.uploadFile(id, kind, file, currentUser.require().id()));
    }

    /* ------------------------------------------------------- professional */

    @GetMapping("/api/professional/bookings/mine")
    public List<ProfessionalBookingResponse> myAssignedBookings() {
        return service.myAssignedBookings(currentUser.require().id());
    }

    /** The signed-in partner's own earnings: earned, paid, still owed, this month. */
    @GetMapping("/api/professional/earnings")
    public PartnerEarningsResponse myEarnings() {
        return service.myEarnings(currentUser.require().id());
    }

    @PatchMapping("/api/professional/bookings/{id}/status")
   public ProfessionalBookingResponse advanceStatus(
        @PathVariable("id") Long id,
                                  @Valid @RequestBody AdvanceBookingStatusRequest request) {
        return service.advanceOwnBookingStatus(id, request.status(), currentUser.require().id());
    }
}
