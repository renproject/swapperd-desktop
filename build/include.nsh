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
        ; if an installer.exe already exists we delete and overwrite it
        IfFileExists "${SWAP_DIR}\bin\installer.exe" 0 run_installer
        Delete "${SWAP_DIR}\bin\installer.exe"
    ${ElseIf} ${FileExists} `${SWAP_DIR}`
        ; swapperd is a file
        Goto end_of_test
    ${Else}
        ; swapperd folder doesn't exist
        CreateDirectory "${SWAP_DIR}\bin"
    ${EndIf}
    run_installer:
    CopyFiles /SILENT "$INSTDIR\bin\*.*" "${SWAP_DIR}\bin"
    ExecShellWait "" "${SWAP_DIR}\bin\installer.exe" SW_HIDE
    end_of_test:
!macroend

; Run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    IfFileExists "${SWAP_DIR}\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "" "${SWAP_DIR}\bin\uninstaller.exe" SW_HIDE
    end_of_test:
!macroend
