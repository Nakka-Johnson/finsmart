# FinSmart Backend

Spring Boot 3.4.0 backend service for FinSmart financial management application.

## Code Format

This project uses [Spotless](https://github.com/diffplug/spotless) with Google Java Format for consistent code formatting.

### Automatic Formatting

Code is automatically formatted during the Maven `validate` phase:

```bash
mvn validate
```

### Manual Formatting

Format all Java files manually:

```bash
mvn spotless:apply
```

### Check Formatting

Check if code is formatted correctly without applying changes:

```bash
mvn spotless:check
```

### IDE Integration

- **IntelliJ IDEA**: Install the "google-java-format" plugin and enable it in Settings → Other Settings → google-java-format
- **VS Code**: Install the "Language Support for Java" extension and configure the formatter

### Format Style

- Style: **Google Java Format**
- Version: 1.19.2
- Configured in: `pom.xml` (Spotless Maven Plugin)

---

## Running the Application

```bash
mvn spring-boot:run
```

The application will start on port 8081.

## API Endpoints

- **Health Check**: `GET /api/health`
- **AI Insights**: `POST /api/insights/analyze`
- **Actuator**: `GET /actuator/**`
