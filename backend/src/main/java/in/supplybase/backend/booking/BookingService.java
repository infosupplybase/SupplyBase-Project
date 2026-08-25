package in.supplybase.backend.booking;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.CreateBookingRequest;
import in.supplybase.backend.booking.dto.UpdateBookingRequest;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.PhoneNumbers;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.config.AppProperties;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    /** A real person does not book six site visits in an hour; a bot does. */
    private static final int MAX_PER_PHONE_PER_HOUR = 5;

    private final BookingRepository bookings;
    private final UserRepository users;
    private final AppProperties props;
    private final ObjectProvider<JavaMailSender> mailSender;

    public BookingService(BookingRepository bookings, UserRepository users,
                          AppProperties props, ObjectProvider<JavaMailSender> mailSender) {
        this.bookings = bookings;
        this.users = users;
        this.props = props;
        this.mailSender = mailSender;
    }

    @Transactional
    public BookingResponse.Receipt create(CreateBookingRequest request, Long signedInUserId) {
        String phone = PhoneNumbers.normalise(request.phone());

        long recent = bookings.countByPhoneAndCreatedAtAfter(
                phone, Instant.now().minus(Duration.ofHours(1)));
        if (recent >= MAX_PER_PHONE_PER_HOUR) {
            throw ApiException.badRequest(
                    "We already have your booking. Please call us if it is urgent.");
        }

        Booking booking = Booking.builder()
                .reference(Reference.forBooking())
                .bookingType(request.bookingType())
                .serviceSlug(request.serviceSlug())
                .serviceLabel(request.serviceLabel())
                .propertyType(blankToNull(request.propertyType()))
                .areaSqft(request.areaSqft())
                .workNature(blankToNull(request.workNature()))
                .workOption(blankToNull(request.workOption()))
                .workDetail(blankToNull(request.workDetail()))
                .materialSupplier(request.materialSupplier())
                .budgetRange(blankToNull(request.budgetRange()))
                .preferredDate(request.preferredDate())
                .preferredSlot(request.preferredSlot())
                .name(request.name().trim())
                .phone(phone)
                // Most people use the same number for both, so an empty
                // WhatsApp box means "same as my mobile", not "do not message".
                .whatsapp(request.whatsapp() == null || request.whatsapp().isBlank()
                        ? phone : PhoneNumbers.normalise(request.whatsapp()))
                .email(blankToNull(request.email()))
                .address(blankToNull(request.address()))
                .location(blankToNull(request.location()))
                .status(BookingStatus.NEW)
                .attachmentsPending(request.attachmentsPresent())
                .build();

        if (signedInUserId != null) {
            users.findById(signedInUserId).ifPresent(booking::setUser);
        }

        Booking saved = bookings.save(booking);
        notifyStaff(saved);
        return BookingResponse.Receipt.of(saved);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> list(BookingStatus status, BookingType type, Pageable pageable) {
        Page<Booking> page;
        if (status != null) {
            page = bookings.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (type != null) {
            page = bookings.findByBookingTypeOrderByCreatedAtDesc(type, pageable);
        } else {
            page = bookings.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(BookingResponse::from);
    }

    /** The office's day sheet. */
    @Transactional(readOnly = true)
    public List<BookingResponse> forDate(LocalDate date) {
        return bookings.findByPreferredDateOrderByPreferredSlotAsc(date).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(Long userId) {
        return bookings.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional
    public BookingResponse update(Long id, UpdateBookingRequest request) {
        Booking booking = bookings.findById(id)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        booking.setStatus(request.status());
        if (request.adminNotes() != null) {
            booking.setAdminNotes(request.adminNotes());
        }
        return BookingResponse.from(bookings.save(booking));
    }

    /**
     * Best-effort. A dead SMTP server must never turn a captured booking into
     * a 500 for the customer — the row is already committed.
     */
    private void notifyStaff(Booking booking) {
        if (!props.notifications().emailEnabled()) {
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(props.notifications().enquiryRecipient());
            message.setSubject("New %s booking %s — %s".formatted(
                    booking.getBookingType(), booking.getReference(), booking.getName()));
            message.setText((
                    "A site visit has been requested through the website.\n\n"
                    + "Reference:  %s\n"
                    + "Type:       %s\n"
                    + "Service:    %s\n"
                    + "Property:   %s\n"
                    + "Area:       %s\n"
                    + "Work:       %s / %s\n"
                    + "Material:   %s\n"
                    + "Budget:     %s\n\n"
                    + "Preferred:  %s at %s\n\n"
                    + "Name:       %s\n"
                    + "Mobile:     %s\n"
                    + "WhatsApp:   %s\n"
                    + "Email:      %s\n"
                    + "Location:   %s\n"
                    + "Address:    %s\n\n"
                    + "Photos to follow on WhatsApp: %s\n\n"
                    + "%s\n").formatted(
                    booking.getReference(), booking.getBookingType(), booking.getServiceLabel(),
                    orDash(booking.getPropertyType()),
                    booking.getAreaSqft() == null ? "—" : booking.getAreaSqft() + " sq.ft.",
                    orDash(booking.getWorkNature()), orDash(booking.getWorkOption()),
                    booking.getMaterialSupplier() == null ? "—" : booking.getMaterialSupplier().name(),
                    orDash(booking.getBudgetRange()),
                    booking.getPreferredDate() == null ? "—" : booking.getPreferredDate().toString(),
                    booking.getPreferredSlot() == null ? "—" : booking.getPreferredSlot().label(),
                    booking.getName(), booking.getPhone(), orDash(booking.getWhatsapp()),
                    orDash(booking.getEmail()), orDash(booking.getLocation()),
                    orDash(booking.getAddress()),
                    booking.isAttachmentsPending() ? "YES" : "no",
                    orDash(booking.getWorkDetail())));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email booking {} — it is saved regardless",
                    booking.getReference(), ex);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
