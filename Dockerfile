# ── Build stage ──────────────────────────────────────────────
FROM maven:3.9.7-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download deps first (layer cache)
RUN mvn dependency:go-offline -B
COPY src ./src
COPY frontend ./frontend
RUN mvn clean package -DskipTests -B

# ── Runtime stage ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S dealerpro && adduser -S dealerpro -G dealerpro
COPY --from=build /app/target/dealerpro-*.jar app.jar
RUN chown dealerpro:dealerpro app.jar
USER dealerpro
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
