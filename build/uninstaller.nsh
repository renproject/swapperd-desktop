; https://www.electron.build/configuration/nsis#custom-nsis-script
; run the swapperd uninstaller to deregister services
!macro customUnInstall
    RequestExecutionLevel admin
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "runas" "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
