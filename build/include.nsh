; https://www.electron.build/configuration/nsis#custom-nsis-script

!include 'LogicLib.nsh'

!define SWAP_DIR "$APPDATA\swapperd"

; Run installer and uninstaller with admin privileges
!macro customHeader
    RequestExecutionLevel admin
!macroend

; Run the swapperd uninstaller if it exists
!macro uninstallSwapperd
    IfFileExists "${SWAP_DIR}\bin\uninstaller.exe" 0 end_of_test
    ExecShellWait "" "${SWAP_DIR}\bin\uninstaller.exe" SW_HIDE
    end_of_test:
!macroend

; Run the installer to register the service
!macro customInstall
    ${If} ${FileExists} `${SWAP_DIR}\*.*`
        ; swapperd is a directory
        ; uninstall Swapperd
        !insertmacro uninstallSwapperd
        ; remove the entire bin directory
        RMDir /r "${SWAP_DIR}\bin"
    ${ElseIf} ${FileExists} `${SWAP_DIR}`
        ; swapperd is a file
        Goto end_of_custom_install
    ${Else}
        ; swapperd folder doesn't exist
    ${EndIf}
    CreateDirectory "${SWAP_DIR}\bin"
    CopyFiles /SILENT "$INSTDIR\bin\*.*" "${SWAP_DIR}\bin"
    ExecShellWait "" "${SWAP_DIR}\bin\installer.exe" SW_HIDE
    end_of_custom_install:
!macroend

; Run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    !insertmacro uninstallSwapperd
!macroend
