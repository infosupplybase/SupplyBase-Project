package in.supplybase.backend.booking.dto;

import in.supplybase.backend.booking.BookingAnswer;

/**
 * One answer from the booking wizard, as shown back to whoever can see this
 * booking (the customer who made it, or staff).
 *
 * questionText/answerLabel fall back to the raw key/value on the rare answer
 * that predates this being copied in at write time (see BookingAnswer) —
 * still readable, never a blank line in the UI.
 */
public record BookingAnswerResponse(
        String questionText, String answerLabel, int quantity, Long lineTotalPaise) {

    public static BookingAnswerResponse from(BookingAnswer a) {
        return new BookingAnswerResponse(
                a.getQuestionText() != null ? a.getQuestionText() : a.getQuestionKey(),
                a.getAnswerLabel() != null ? a.getAnswerLabel() : a.getAnswerValue(),
                a.getQuantity(),
                a.getLineTotalPaise());
    }
}
