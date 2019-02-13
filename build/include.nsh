; https://www.electron.build/configuration/nsis#custom-nsis-script
!macro customHeader
    RequestExecutionLevel admin
!macroend

; run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "runas" "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
