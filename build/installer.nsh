; run the swapperd uninstaller to deregister services
!macro customUnInstall
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecWait "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
