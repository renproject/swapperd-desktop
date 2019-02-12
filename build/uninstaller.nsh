; https://www.electron.build/configuration/nsis
; run the swapperd uninstaller to deregister services
!macro customUnInit
    RequestExecutionLevel admin
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "runas" "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
