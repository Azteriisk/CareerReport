Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\thera\Documents\Code\resume_builder\public\homepage.png")
$img.Save("c:\Users\thera\Documents\Code\resume_builder\public\homepage.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$img.Dispose()
Write-Output "JPEG Conversion Complete!"
Get-ChildItem c:\Users\thera\Documents\Code\resume_builder\public
