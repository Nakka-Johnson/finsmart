# WSL2 Setup Guide for PostgreSQL Fix

## Current Status
❌ WSL2 is NOT installed on your system  
❌ Docker Desktop is using Hyper-V backend (causes PostgreSQL auth issues)

## Why WSL2?
The PostgreSQL authentication issue (SQLSTATE 28P01) is caused by Docker Desktop for Windows networking limitations with Hyper-V backend. WSL2 resolves this by providing better Linux compatibility.

---

## Step-by-Step Installation

### 1️⃣ Install WSL2 (Required - System Restart Needed)

**Run PowerShell as Administrator**, then execute:

```powershell
wsl --install
```

**What this does:**
- Enables Windows Subsystem for Linux (WSL)
- Enables Virtual Machine Platform
- Downloads and installs Ubuntu Linux
- **Requires system restart**

**After restart:**
- Ubuntu will open automatically for first-time setup
- Create a Linux username and password (remember these!)

---

### 2️⃣ Verify WSL2 Installation

After restart, run in PowerShell:

```powershell
wsl --list --verbose
```

**Expected output:**
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

The VERSION must be **2** (not 1).

---

### 3️⃣ Configure Docker Desktop

1. **Open Docker Desktop**

2. **Click Settings (⚙️ gear icon)**

3. **General Tab:**
   - ✅ Check: **"Use the WSL 2 based engine"**
   - Click **"Apply & Restart"**

4. **Resources → WSL Integration:**
   - ✅ Enable: **"Enable integration with my default WSL distro"**
   - ✅ Enable: **Ubuntu** (toggle on)
   - Click **"Apply & Restart"**

5. **Wait for Docker to restart** (green light in bottom-left)

---

### 4️⃣ Recreate PostgreSQL Container

In PowerShell (from project root):

```powershell
# Remove old container
cd D:\Dev\projects\finsmart
docker-compose down -v

# Start fresh container with WSL2 backend
docker-compose up -d

# Wait for database to be ready (15 seconds)
Start-Sleep -Seconds 15

# Verify container is healthy
docker ps --filter name=finsmart-db
```

---

### 5️⃣ Test Spring Boot Connection

```powershell
cd D:\Dev\projects\finsmart\backend
.\mvnw.cmd spring-boot:run
```

**Expected result:**
```
✓ DB OK: basic SELECT 1 succeeded
Tomcat started on port 8080
```

---

## Verification Checklist

After completing setup, verify:

- [ ] WSL2 installed: `wsl --list --verbose` shows VERSION 2
- [ ] Docker Desktop shows "WSL 2 based engine" enabled
- [ ] Container created: `docker ps` shows `finsmart-db` healthy
- [ ] Spring Boot starts without authentication errors
- [ ] Can access http://localhost:8080/api/debug/db-ping → `{"ok":true}`

---

## Troubleshooting

### Issue: "wsl --install" fails
**Solution:** Use manual installation steps from Microsoft:
https://docs.microsoft.com/en-us/windows/wsl/install-manual

### Issue: Docker Desktop won't enable WSL2
**Solution:** 
1. Check Windows version: `winver` (need Windows 10 version 2004+ or Windows 11)
2. Enable Virtualization in BIOS/UEFI
3. Ensure Hyper-V is enabled: `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V`

### Issue: Container starts but authentication still fails
**Solution:**
1. Completely remove Docker volumes: `docker-compose down -v`
2. Remove Docker Desktop data (Settings → Troubleshoot → Clean/Purge data)
3. Restart Docker Desktop
4. Recreate containers: `docker-compose up -d`

### Issue: Port 5433 already in use
**Solution:**
```powershell
# Find process using port 5433
Get-NetTCPConnection -LocalPort 5433 | Select-Object OwningProcess
# Kill the process
Stop-Process -Id <ProcessId> -Force
```

---

## Alternative: Continue with H2 (No WSL2 Required)

If you prefer not to install WSL2 right now, you can continue development with the H2 in-memory database that's already working:

**Build & Test:**
```powershell
cd D:\Dev\projects\finsmart\backend
.\mvnw.cmd clean package
# Tests pass with H2
```

**Deploy Later:**
When deploying to production/staging, PostgreSQL will work correctly since it won't be running through Docker Desktop on Windows.

---

## Resources

- [WSL2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/windows/wsl/)
- [PostgreSQL Docker on WSL2](https://docs.docker.com/desktop/windows/wsl/#database-engines)

---

## Next Steps After WSL2 Setup

Once Spring Boot successfully connects to PostgreSQL:

1. ✅ Run Flyway migrations (automatic on startup)
2. ✅ Verify seed data: http://localhost:8080/api/debug/seed-sanity
3. ✅ Test Phase 2 endpoints
4. ✅ Build production JAR: `.\mvnw.cmd clean package`

