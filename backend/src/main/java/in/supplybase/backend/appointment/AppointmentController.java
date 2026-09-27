package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.appointment.dto.BlackoutResponse;
import in.supplybase.backend.appointment.dto.CreateBlackoutRequest;
import in.supplybase.backend.appointment.dto.CreateSlotRuleRequest;
import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.appointment.dto.SlotRuleResponse;
import in.supplybase.backend.appointment.dto.UpdateSlotRuleRequest;
import in.supplybase.backend.catalogue.CatalogueService;
import jakarta.validation.Valid;

@RestController
public class AppointmentController {

    private final AppointmentService appointments;
    private final CatalogueService catalogue;

    public AppointmentController(AppointmentService appointments, CatalogueService catalogue) {
        this.appointments = appointments;
        this.catalogue = catalogue;
    }

    /**
     * Public. The booking form asks this rather than holding its own idea of
     * when the office is open.
     */
    @GetMapping("/api/appointments/available-slots")
    public List<DayAvailabilityResponse> availableSlots(
            @RequestParam String service,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(defaultValue = "14") int days) {
        Long categoryId = catalogue.requireCategory(service).getId();
        return appointments.availability(categoryId, from, days);
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/appointment-rules")
    public List<SlotRuleResponse> listRules() {
        return appointments.listRules();
    }

    @PostMapping("/api/admin/appointment-rules")
    public ResponseEntity<SlotRuleResponse> createRule(
            @Valid @RequestBody CreateSlotRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointments.createRule(request));
    }

    @PutMapping("/api/admin/appointment-rules/{id}")
    public SlotRuleResponse updateRule(@PathVariable Long id,
                                       @Valid @RequestBody UpdateSlotRuleRequest request) {
        return appointments.updateRule(id, request);
    }

    /** Soft delete: sets active=false rather than removing the row. */
    @DeleteMapping("/api/admin/appointment-rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        appointments.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/appointment-blackouts")
    public List<BlackoutResponse> listBlackouts() {
        return appointments.listBlackouts();
    }

    @PostMapping("/api/admin/appointment-blackouts")
    public ResponseEntity<BlackoutResponse> createBlackout(
            @Valid @RequestBody CreateBlackoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointments.createBlackout(request));
    }

    @DeleteMapping("/api/admin/appointment-blackouts/{id}")
    public ResponseEntity<Void> deleteBlackout(@PathVariable Long id) {
        appointments.deleteBlackout(id);
        return ResponseEntity.noContent().build();
    }
}
