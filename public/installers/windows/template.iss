; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
{{=<% %>=}}
AppId={{B24F2A46-FDB9-46D1-88FF-CF90FE1A2080}
<%={{ }}=%>
AppName={{appName}}
AppVersion={{appVersion}}
AppPublisher={{publisher}}
DefaultDirName={pf}/{{appName}}
DisableProgramGroupPage=yes
LicenseFile={{{licenseFile}}}
OutputBaseFilename={{outputFilename}}
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 0,6.1

[Files]
Source: "{{{appDir}}}/{{packageName}}.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{{{appDir}}}/*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{commonprograms}\{{appName}}"; Filename: "{app}\{{packageName}}.exe"
Name: "{commondesktop}\{{appName}}"; Filename: "{app}\{{packageName}}.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{{appName}}"; Filename: "{app}\{{packageName}}.exe"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{{packageName}}.exe"; Description: "{cm:LaunchProgram,Swapper}"; Flags: nowait postinstall skipifsilent

