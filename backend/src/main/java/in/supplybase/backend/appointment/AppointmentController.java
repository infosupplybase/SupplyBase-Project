package in.supplybase.backend.appointment;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.catalogue.CatalogueService;

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
}
