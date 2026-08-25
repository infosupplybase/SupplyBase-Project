package in.supplybase.backend.enquiry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.enquiry.dto.CreateEnquiryRequest;
import in.supplybase.backend.enquiry.dto.EnquiryResponse;
import in.supplybase.backend.enquiry.dto.UpdateEnquiryRequest;
import jakarta.validation.Valid;

@RestController
public class EnquiryController {

    private final EnquiryService service;

    public EnquiryController(EnquiryService service) {
        this.service = service;
    }

    /** Public. This is what the quote form and contact form post to. */
    @PostMapping("/api/enquiries")
    public ResponseEntity<EnquiryResponse.Receipt> create(
            @Valid @RequestBody CreateEnquiryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/enquiries")
    public Page<EnquiryResponse> list(@RequestParam(required = false) EnquiryStatus status,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.list(status, PageRequest.of(page, Math.min(size, 100)));
    }

    @GetMapping("/api/admin/enquiries/{id}")
    public EnquiryResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PatchMapping("/api/admin/enquiries/{id}")
    public EnquiryResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateEnquiryRequest request) {
        return service.update(id, request);
    }
}
