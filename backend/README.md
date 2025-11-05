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

---

## Local DB Runbook

### Port Mapping
- Docker container exposes PostgreSQL on **5433:5432** (host:container)
- Connect to `127.0.0.1:5433` from your local machine

### Starting the Database

From the repository root:

```bash
docker compose up -d
```

Wait ~10 seconds for PostgreSQL to be ready.

### Running the Backend

From the `backend` folder:

```bash
mvn spring-boot:run
```

### Verifying DB Connectivity

Open in browser or curl:

```bash
curl http://localhost:8080/api/debug/db-ping
```

Expected response: `{"ok":true}`

### Troubleshooting 28P01 Authentication Error

If you see `SQLSTATE 28P01: password authentication failed`:

1. **Verify connection details:**
   - Host: `127.0.0.1` (not `localhost`)
   - Port: `5433` (not `5432`)
   - Username: `finsmart`
   - Password: `finsmartpwd`

2. **Check for environment variable overrides:**
   ```bash
   # PowerShell
   Remove-Item Env:SPRING_DATASOURCE_URL -ErrorAction SilentlyContinue
   Remove-Item Env:SPRING_DATASOURCE_USERNAME -ErrorAction SilentlyContinue
   Remove-Item Env:SPRING_DATASOURCE_PASSWORD -ErrorAction SilentlyContinue
   ```

3. **Restart the database container:**
   ```bash
   docker compose down -v
   docker compose up -d
   ```

4. **Check application.yml:**
   - Ensure URL is: `jdbc:postgresql://127.0.0.1:5433/finsmartdb?sslmode=disable`

---

## API Endpoints

- **Health Check**: `GET /api/health`
- **AI Insights**: `POST /api/insights/analyze`
- **Actuator**: `GET /actuator/**`
