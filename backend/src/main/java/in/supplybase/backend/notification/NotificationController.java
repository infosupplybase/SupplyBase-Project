
package in.supplybase.backend.notification;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.auth.AuthenticatedUser;
import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifications;
    private final CurrentUser currentUser;

    public NotificationController(
            NotificationRepository notifications,
            CurrentUser currentUser) {
        this.notifications = notifications;
        this.currentUser = currentUser;
    }

    @GetMapping
    @Transactional
    public List<NotificationItem> getNotifications() {
    	AuthenticatedUser user = currentUser.require();

        return notifications
                .findByRecipient_IdOrderByCreatedAtDesc(user.id())
                .stream()
                .map(NotificationItem::from)
                .toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
    	AuthenticatedUser user = currentUser.require();

        return Map.of(
                "count",
                notifications.countByRecipient_IdAndReadFalse(user.id())
        );
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public Map<String, String> markAsRead(@PathVariable Long id) {
    	AuthenticatedUser user = currentUser.require();

        Notification notification = notifications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getRecipient().getId().equals(user.id())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Notification not found");
        }

        notification.setRead(true);

        return Map.of("message", "Notification marked as read");
    }

    public record NotificationItem(
            Long id,
            String title,
            String message,
            String notificationType,
            Long relatedBookingId,
            boolean read,
            java.time.Instant createdAt) {

        static NotificationItem from(Notification notification) {
            return new NotificationItem(
                    notification.getId(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getNotificationType(),
                    notification.getRelatedBookingId(),
                    notification.isRead(),
                    notification.getCreatedAt()
            );
        }
    }
}
