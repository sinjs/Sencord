$Dir = $PSScriptRoot

if (!(Get-Command cl.exe)) {
    Write-Warning "C++ Compiler not detected, calling Launch-VSDevShell"
    & 'C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\Launch-VsDevShell.ps1' -ErrorAction Break
}

Remove-Item -Recurse -Force -ErrorAction Ignore $Dir\build
New-Item -ItemType Directory $Dir\build | Out-Null

cl.exe /nologo /LD /Fo"$Dir\\build\\" $Dir\module\module.cc /link /NOEXP /NOIMPLIB user32.lib "/OUT:$Dir\build\MessageBoxModule.dll"
cl.exe /nologo /EHsc /Fo"$Dir\\build\\" $Dir\caller\caller.cc /link /NOEXP /NOIMPLIB user32.lib "/OUT:$Dir\build\CallDll.exe"

Remove-Item $Dir\*.obj
