Param()

$src = "assets/complogo.jpg"
$outIcon = "assets/icon.png"
$outFav = "assets/favicon.png"
$outAdapt = "assets/adaptive-icon.png"

function Find-ImageMagickCmd {
    # Prefer 'magick' (ImageMagick 7+)
    if (Get-Command magick -ErrorAction SilentlyContinue) { return "magick" }
    # If 'convert' exists, ensure it's ImageMagick (Windows has native convert)
    if (Get-Command convert -ErrorAction SilentlyContinue) {
        try {
            $ver = & convert -version 2>&1
            if ($ver -match "ImageMagick") { return "convert" }
            else { return $null }
        } catch {
            return $null
        }
    }
    return $null
}

$cmd = Find-ImageMagickCmd
if (-not $cmd) {
    Write-Error "ImageMagick not found or 'convert' is the Windows builtin. Install ImageMagick and ensure 'magick' is on PATH."
    exit 1
}

Write-Host "Generating icons from $src using $cmd..."
if ($cmd -eq 'magick') {
    & magick convert $src -resize 1024x1024^ -gravity center -extent 1024x1024 $outIcon
    & magick convert $src -resize 512x512^ -gravity center -extent 512x512 $outFav
    & magick convert $src -resize 432x432^ -gravity center -extent 432x432 $outAdapt
} else {
    & convert $src -resize 1024x1024^ -gravity center -extent 1024x1024 $outIcon
    & convert $src -resize 512x512^ -gravity center -extent 512x512 $outFav
    & convert $src -resize 432x432^ -gravity center -extent 432x432 $outAdapt
}

Write-Host "Icons generated: $outIcon, $outFav, $outAdapt"
