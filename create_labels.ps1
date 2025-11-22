# Area labels
gh label create "area:backend" --repo Nakka-Johnson/finsmart --color "0052CC" --description "Backend (Spring Boot/Java)" --force
gh label create "area:frontend" --repo Nakka-Johnson/finsmart --color "00B8D9" --description "Frontend (React/TypeScript/Vite)" --force
gh label create "area:ai" --repo Nakka-Johnson/finsmart --color "6554C0" --description "AI service (FastAPI/Python)" --force
gh label create "area:infra" --repo Nakka-Johnson/finsmart --color "FF5630" --description "Infrastructure (Docker/CI/CD)" --force
gh label create "area:docs" --repo Nakka-Johnson/finsmart --color "00875A" --description "Documentation" --force

# Type labels
gh label create "type:bug" --repo Nakka-Johnson/finsmart --color "D73A4A" --description "Something isn't working" --force
gh label create "type:feature" --repo Nakka-Johnson/finsmart --color "0E8A16" --description "New feature or request" --force
gh label create "type:chore" --repo Nakka-Johnson/finsmart --color "FEF2C0" --description "Maintenance and chores" --force
gh label create "type:techdebt" --repo Nakka-Johnson/finsmart --color "FBCA04" --description "Technical debt" --force

# Priority labels
gh label create "priority:P0" --repo Nakka-Johnson/finsmart --color "B60205" --description "Critical - Immediate attention" --force
gh label create "priority:P1" --repo Nakka-Johnson/finsmart --color "D93F0B" --description "High priority" --force
gh label create "priority:P2" --repo Nakka-Johnson/finsmart --color "FBCA04" --description "Medium priority" --force
