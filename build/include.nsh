; https://www.electron.build/configuration/nsis#custom-nsis-script

!include 'LogicLib.nsh'

!define SWAP_DIR "$APPDATA\swapperd"

; Run installer and uninstaller with admin privileges
!macro customHeader
    RequestExecutionLevel admin
!macroend

; Run the installer to register the service
!macro customInstall
    ${If} ${FileExists} `${SWAP_DIR}\*.*`
        ; swapperd is a directory
        Goto run_installer
    ${ElseIf} ${FileExists} `${SWAP_DIR}`
        ; swapperd is a file
        Goto end_of_test
    ${Else}
        ; swapperd folder doesn't exist
        CreateDirectory "${SWAP_DIR}\bin"
        CopyFiles /SILENT "$INSTDIR\bin\*.*" "${SWAP_DIR}\bin"
        CopyFiles /SILENT "$INSTDIR\config.json" "${SWAP_DIR}"
    ${EndIf}
    run_installer:
    IfFileExists "${SWAP_DIR}\bin\installer.exe" 0 end_of_test
    ExecShellWait "" "${SWAP_DIR}\bin\installer.exe" SW_HIDE
    end_of_test:
!macroend

; Run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    IfFileExists "${SWAP_DIR}\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "" "${SWAP_DIR}\bin\uninstaller.exe" SW_HIDE
    end_of_test:
!macroend
