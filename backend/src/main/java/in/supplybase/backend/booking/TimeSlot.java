package in.supplybase.backend.booking;

/**
 * The five visiting windows offered on the form.
 *
 * An enum rather than free text so the office can sort and group by slot, and
 * so a typo in a request cannot invent a sixth one. The label is what the
 * customer saw, kept here so the site and the API can never drift apart on it.
 */
public enum TimeSlot {
    SLOT_10AM("10:00 AM"),
    SLOT_12PM("12:00 PM"),
    SLOT_2PM("2:00 PM"),
    SLOT_4PM("4:00 PM"),
    SLOT_6PM("6:00 PM");

    private final String label;

    TimeSlot(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
