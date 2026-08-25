package in.supplybase.backend.enquiry;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.enquiry.dto.CreateEnquiryRequest;
import in.supplybase.backend.enquiry.dto.EnquiryResponse;
import in.supplybase.backend.enquiry.dto.UpdateEnquiryRequest;

@Service
public class EnquiryService {

    private static final Logger log = LoggerFactory.getLogger(EnquiryService.class);

    /** A real person does not file six enquiries in an hour; a bot does. */
    private static final int MAX_PER_PHONE_PER_HOUR = 5;

    private final EnquiryRepository enquiries;
    private final AppProperties props;
    /** ObjectProvider, so the app still starts when no SMTP server is configured. */
    private final ObjectProvider<JavaMailSender> mailSender;

    public EnquiryService(EnquiryRepository enquiries, AppProperties props,
                          ObjectProvider<JavaMailSender> mailSender) {
        this.enquiries = enquiries;
        this.props = props;
        this.mailSender = mailSender;
    }

    @Transactional
    public EnquiryResponse.Receipt create(CreateEnquiryRequest request) {
        String phone = request.phone().replaceAll("\\s+", "");
        long recent = enquiries.countByPhoneAndCreatedAtAfter(phone, Instant.now().minus(Duration.ofHours(1)));
        if (recent >= MAX_PER_PHONE_PER_HOUR) {
            throw ApiException.badRequest(
                    "We already have your enquiry. Please call us if it is urgent.");
        }

        Enquiry enquiry = enquiries.save(Enquiry.builder()
                .reference(Reference.forEnquiry())
                .name(request.name().trim())
                .phone(phone)
                .email(blankToNull(request.email()))
                .projectType(blankToNull(request.projectType()))
                .serviceSlug(blankToNull(request.service()))
                .location(blankToNull(request.location()))
                .budgetRange(blankToNull(request.budget()))
                .description(blankToNull(request.description()))
                .source(request.source() == null ? EnquirySource.QUOTE_FORM : request.source())
                .status(EnquiryStatus.NEW)
                .build());

        notifyStaff(enquiry);
        return EnquiryResponse.Receipt.of(enquiry);
    }

    @Transactional(readOnly = true)
    public Page<EnquiryResponse> list(EnquiryStatus status, Pageable pageable) {
        Page<Enquiry> page = status == null
                ? enquiries.findAllByOrderByCreatedAtDesc(pageable)
                : enquiries.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(EnquiryResponse::from);
    }

    @Transactional(readOnly = true)
    public EnquiryResponse get(Long id) {
        return enquiries.findById(id).map(EnquiryResponse::from)
                .orElseThrow(() -> ApiException.notFound("That enquiry"));
    }

    @Transactional
    public EnquiryResponse update(Long id, UpdateEnquiryRequest request) {
        Enquiry enquiry = enquiries.findById(id)
                .orElseThrow(() -> ApiException.notFound("That enquiry"));
        enquiry.setStatus(request.status());
        if (request.adminNotes() != null) {
            enquiry.setAdminNotes(request.adminNotes());
        }
        return EnquiryResponse.from(enquiries.save(enquiry));
    }

    /**
     * Best-effort only. A dead SMTP server must never turn a captured lead
     * into a 500 for the customer — the enquiry is already committed.
     */
    private void notifyStaff(Enquiry enquiry) {
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
            message.setSubject("New enquiry " + enquiry.getReference() + " — " + enquiry.getName());
            message.setText((
                    "A new enquiry arrived through the website.\n\n"
                    + "Reference:  %s\n"
                    + "Name:       %s\n"
                    + "Phone:      %s\n"
                    + "Email:      %s\n"
                    + "Service:    %s\n"
                    + "Type:       %s\n"
                    + "Location:   %s\n"
                    + "Budget:     %s\n\n"
                    + "%s\n").formatted(
                    enquiry.getReference(), enquiry.getName(), enquiry.getPhone(),
                    orDash(enquiry.getEmail()), orDash(enquiry.getServiceSlug()),
                    orDash(enquiry.getProjectType()), orDash(enquiry.getLocation()),
                    orDash(enquiry.getBudgetRange()), orDash(enquiry.getDescription())));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email enquiry {} — it is saved regardless",
                    enquiry.getReference(), ex);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
