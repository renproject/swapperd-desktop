; https://www.electron.build/configuration/nsis#custom-nsis-script
!include LogicLib.nsh
!include nsDialogs.nsh

Var mnemonicInput
Var mnemonicInput_State
Var hwndNewAccountRadio
Var hwndNewAccountRadio_State
Var hwndRestoreAccountRadio
Var hwndRestoreAccountRadio_State

Page custom accountSelectPage accountSelectPageLeave
Page custom mnemonicPage mnemonicPageLeave
 
Function accountSelectPage
	nsDialogs::Create 1018 
	Pop $0
	${NSD_CreateLabel} 0 0 75% 20u "Do you wish restore a previous account."
	Pop $0 

	${NSD_CreateRadioButton} 20 50 80% 25u "Create a new account"
	Pop $hwndNewAccountRadio
	${NSD_AddStyle} $hwndNewAccountRadio ${WS_GROUP}

	${NSD_CreateRadioButton} 20 80 80% 25u "Restore a previous account"
	Pop $hwndRestoreAccountRadio

	; restore the previous state
	${If} $hwndNewAccountRadio_State == ${BST_CHECKED}
		${NSD_Check} $hwndNewAccountRadio
	${ElseIf} $hwndRestoreAccountRadio_State == ${BST_CHECKED}
		${NSD_Check} $hwndRestoreAccountRadio
	${Else}
		; check the new account radio by default
		${NSD_Check} $hwndNewAccountRadio
	${EndIf}
	nsDialogs::Show
FunctionEnd

Function accountSelectPageLeave
	${NSD_GetState} $hwndNewAccountRadio $hwndNewAccountRadio_State
	${NSD_GetState} $hwndRestoreAccountRadio $hwndRestoreAccountRadio_State
FunctionEnd
 
Function mnemonicPage
    ${If} $hwndNewAccountRadio_State == ${BST_CHECKED}
		Abort
    ${EndIF}

	nsDialogs::Create 1018
	Pop $0

	${If} $0 == error
		Abort
	${EndIf}

	${NSD_CreateLabel} 0 0 100% 12u "Enter the mnemonic of the previous account:"
	Pop $0

	${NSD_CreateText} 0 13u 100% 12u $mnemonicInput_State
	Pop $mnemonicInput
	${NSD_OnChange} $mnemonicInput OnTextChange
	nsDialogs::Show
FunctionEnd

; Save the mnemonic on change
Function OnTextChange
	Pop $0 ; Widget handle is on stack
	${NSD_GetText} $mnemonicInput $mnemonicInput_State
FunctionEnd

Function mnemonicPageLeave
	${If} $mnemonicInput_State == ""
		MessageBox mb_ok "Mnemonic cannot be empty!"
		Abort
	${EndIf}
FunctionEnd

; Run installer and uninstaller with admin privileges
!macro customHeader
    RequestExecutionLevel admin
!macroend

; Run the installer to register the service
!macro customInstall
	IfFileExists "$INSTDIR\bin\installer.exe" 0 end_of_test
	${If} $hwndRestoreAccountRadio_State == ${BST_CHECKED}
	${AndIfNot} $mnemonicInput_State == ""
		ExecWait "$INSTDIR\bin\installer.exe --mnemonic $mnemonicInput_State"
	${Else}
		ExecWait "$INSTDIR\bin\installer.exe"
	${EndIf}
	end_of_test:
!macroend

; Run the swapperd uninstaller to deregister services
!macro unregisterFileAssociations
    IfFileExists "$INSTDIR\bin\uninstaller.exe" 0 end_of_test
    ExecWait "$INSTDIR\bin\uninstaller.exe"
    end_of_test:
!macroend
