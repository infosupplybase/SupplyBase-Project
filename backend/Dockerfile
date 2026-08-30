# Self-contained Spring Boot API image for Render and Railway.
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -DskipTests dependency:go-offline

COPY src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN useradd --system --uid 10001 supplybase
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/supplybase-api.jar
RUN chown supplybase:supplybase /app/supplybase-api.jar

USER supplybase
EXPOSE 8080

# PORT is injected by Render/Railway. Secrets are injected by the host.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/supplybase-api.jar"]
