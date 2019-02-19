; https://www.electron.build/configuration/nsis#custom-nsis-script

; Run installer and uninstaller with admin privileges
!macro customHeader
    RequestExecutionLevel admin
!macroend

; Run the installer to register the service
!macro customInstall
	IfFileExists "$INSTDIR\bin\installer.exe" 0 end_of_test
	ExecWait "$INSTDIR\bin\installer.exe"
	end_of_test:
!macroend

; Run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecWait "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
