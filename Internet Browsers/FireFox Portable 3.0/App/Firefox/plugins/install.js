// Info about the sequence of steps followed below available at
// http://developer.mozilla.org/en/docs/Using_XPInstall_to_Install_Plugins

// first call initInstall() to start the process
var version = "5.7.712.19360";
var name = "Google Gadget Runtime";
var plid = "@desktop.google.com/" + name + ",version=" + version;
initInstall(name, plid, version);

// attempt to copy the plugin dll to the global plugins dir
var firefox_control_file = "npGoogleGadgetPluginFirefoxWin.dll";
var plugins_dir = "Plugins";
control_result = addFile(plid, version, firefox_control_file, 
		         getFolder(plugins_dir), "");

// if copy to global plugins dir fails with access denied, copy to user profile
// error code from : 
// http://developer.mozilla.org/en/docs/XPInstall_API_Reference:Return_Codes
var access_denied_error = -202;
if (control_result == access_denied_error) {
  var folder_dir = "Win AppData";
  var user_plugins_dir = getFolder(folder_dir) + "Mozilla\\Plugins\\";
  control_result = addFile(plid, version, firefox_control_file, 
                           getFolder("file:///", user_plugins_dir), "");
}

// finalise install
if (control_result == 0) 
  control_result = performInstall();

// success/failed?
if (control_result == 0) {
  refreshPlugins(true);
} else {
  cancelInstall(control_result);
}
