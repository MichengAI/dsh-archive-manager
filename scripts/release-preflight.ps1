[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

# 在推送版本标签前执行，显式使用与 CI 相同的冷却策略。
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    pnpm install --frozen-lockfile --config.minimumReleaseAge=1440 --registry=https://registry.npmjs.org
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    pnpm verify
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}
