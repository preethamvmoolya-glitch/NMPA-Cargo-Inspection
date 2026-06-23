# Run this script after you have your Render backend URL
# Usage: .\set_secret.ps1 -url "https://your-service.onrender.com"
param([string]$url)

if (-not $url) {
    Write-Host "Usage: .\set_secret.ps1 -url 'https://your-service.onrender.com'"
    exit 1
}

Write-Host "Setting VITE_API_URL secret on GitHub..."
$env:VITE_API_URL = $url

# Update the frontend .env.production so local builds also use the right URL
$envContent = "VITE_API_URL=$url"
Set-Content -Path "frontend\.env.production" -Value $envContent

Write-Host "Created frontend\.env.production with VITE_API_URL=$url"
Write-Host ""
Write-Host "Now committing and pushing the env file..."
git add frontend\.env.production
git commit -m "chore: add production API URL for hosted backend"
git push https://github.com/preethamvmoolya-glitch/port_cargo_web.git main

Write-Host ""
Write-Host "Done! GitHub Actions will now rebuild with the live backend URL."
Write-Host "Live site: https://preethamvmoolya-glitch.github.io/port_cargo_web/"
