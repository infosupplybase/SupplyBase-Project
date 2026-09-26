package in.supplybase.backend;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BackendApplication {

	/** Where the business is, and so what "10 AM" and "today" mean. */
	public static final String BUSINESS_TIME_ZONE = "Asia/Kolkata";

	public static void main(String[] args) {
		// The JVM runs in the business's time zone, whatever the server's is.
		// hibernate.jdbc.time_zone is Asia/Kolkata too, and Hibernate converts
		// time-of-day columns (LocalTime) between that zone and the JVM's: on
		// a server left in UTC, a 10:00 visit slot was read back as 04:30 and
		// offered to customers as "4:30 AM". With the two zones the same there
		// is no conversion, and LocalDate.now() is India's today.
		TimeZone.setDefault(TimeZone.getTimeZone(BUSINESS_TIME_ZONE));
		SpringApplication.run(BackendApplication.class, args);
	}

}
