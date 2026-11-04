package in.supplybase.backend.auth.dto;

/**
 * Account and sign-in numbers for the admin dashboard. "Today" starts at
 * midnight India time; "7 days" and "30 days" include today.
 */
public record UserStatsResponse(
        long totalUsers,
        long customers,
        long partners,
        long admins,
        long signupsToday,
        long signups7Days,
        long signups30Days,
        long loginsToday,
        long logins7Days,
        long logins30Days,
        long peopleToday,
        long people7Days,
        long people30Days) {
}
