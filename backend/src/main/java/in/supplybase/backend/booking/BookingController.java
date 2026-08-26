package in.supplybase.backend.booking;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.booking.dto.BookingReceipt;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.CreateBookingRequest;
import in.supplybase.backend.booking.dto.UpdateBookingRequest;
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
     * Public — the booking wizard posts here.
     *
     * Signing in is not required, but if a token happens to be present the
     * booking is attached to that account so it can show on their dashboard.
     * Read optimistically rather than via CurrentUser.require(), which would
     * throw for the visitors who make up most of this traffic.
     */
    @PostMapping("/api/bookings")
    public ResponseEntity<BookingReceipt> create(
            @Valid @RequestBody CreateBookingRequest request) {
        Long userId = null;
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            userId = user.id();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, userId));
    }

    /** A signed-in client's own bookings, for the dashboard. */
    @GetMapping("/api/bookings/mine")
    public List<BookingResponse> mine() {
        return service.myBookings(currentUser.require().id());
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
    public BookingResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateBookingRequest request) {
        return service.update(id, request);
    }
}
