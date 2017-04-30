// Copyright 2005 Google Inc.
// All Rights Reserved.
//

function gMsgHdr(ns_msghdr) {
  this.nsmsghdr = ns_msghdr;
}

gMsgHdr.prototype = {
  get messageKey() {return this.nsmsghdr.messageKey;},
  get messageId() {return this.nsmsghdr.messageId;},
  get flags() {return this.nsmsghdr.flags;},
  get date() {return this.nsmsghdr.date;},
  get ccList() {return this.nsmsghdr.ccList;},
  get author() {return this.nsmsghdr.author;},
  get flags() {return this.nsmsghdr.flags;},
  get subject() {return this.nsmsghdr.subject;},
  get recipients() {return this.nsmsghdr.recipients;},
  get messageSize() {return this.nsmsghdr.messageSize;},
  get messageOffset() { return this.nsmsghdr.messageOffset;},
  get offlineMessageSize() {return this.nsmsghdr.offlineMessageSize;},

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIMsgHdr) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },
  
  nsmsghdr: null
}



function gMsgDBHdr(ns_msgdbhdr) {
  this.nsmsghdr = ns_msgdbhdr;
}

gMsgDBHdr.prototype = new gMsgHdr();

gMsgDBHdr.prototype.StreamMessage = function (aConsumer) {
  var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance().QueryInterface(Components.interfaces.nsIMessenger);
  var message_service = messenger.messageServiceFromURI(this.GetUri());
  message_service.streamMessage(this.GetUri(), aConsumer, null, null, true, "src", null);
};

gMsgDBHdr.prototype.GetUri = function () {
  return this.nsmsghdr.folder.getUriForMsg(this.nsmsghdr);
};

gMsgDBHdr.prototype.GetFolder = function () {
  var gfolder = new gMsgFolder(this.nsmsghdr.folder);
  return gfolder;
};

gMsgDBHdr.prototype.QueryInterface = function(aIID)  {
  if (!aIID.equals(Components.interfaces.gIMsgDBHdr) &&
      !aIID.equals(Components.interfaces.nsISupports)) {
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
  return this;
}



function gSimpleEnumerator(simpleenum) {
  this.nssimpleenum = simpleenum;
}

gSimpleEnumerator.prototype = {
  hasMoreElements: function() {return this.nssimpleenum.hasMoreElements();},
  
  getNext: function() {
    var nsmsghdr = this.nssimpleenum.getNext();
    if (!nsmsghdr) throw Components.results.NS_ERROR_FAILURE;

    if (nsmsghdr.QueryInterface(Components.interfaces.nsIMsgDBHdr) == null) {
      throw Components.results.NS_ERROR_FAILURE;
    }
   
    var ghdr = new gMsgDBHdr(nsmsghdr);
    return ghdr;
  },
  
  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.nsISimpleEnumerator) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },

  nssimpleenum: null
}


function gSupportsArray() {
  this.array = new Array();
}

gSupportsArray.prototype = {
  Count: function() {return this.array.length;},
  GetElementAt: function(index) {return this.array[index];},
  AppendElement: function(item) {this.array[this.array.length] = item;},

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gISupportsArray) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },

  array: null
}

function gMsgFolder(ns_folder) {
  this.nsfolder = ns_folder;
}

gMsgFolder.prototype = {
  get name() {return this.nsfolder.name;},
  get folderURL() {return this.nsfolder.folderURL;},
  get URI() {return this.nsfolder.URI;},
  get hasSubFolders() {return this.nsfolder.hasSubFolders;},
  get locked() {return this.nsfolder.locked;},
  get flags() {return this.nsfolder.flags;},
  get type() {return this.nsfolder.server.type;},

  GetSubFolders: function() {
    var subfolders = new gSupportsArray();
    var nsfolders = this.nsfolder.GetSubFolders();
    if (!nsfolders) throw Components.results.NS_ERROR_FAILURE;

    if (!this.nsfolder.hasSubFolders) {
      return null; // so we don't keep getting errors in js console throw Components.results.NS_ERROR_FAILURE;
    }
    var done = false;
    while (!done) {
      var item = nsfolders.currentItem();
      if (item) {
        var subfolder = item.QueryInterface(Components.interfaces.nsIMsgFolder);
        if (subfolder) {
          var gfolder = new gMsgFolder(subfolder);
          subfolders.AppendElement(gfolder);
        }
        try {
          nsfolders.next();
        } catch (ex) {
          done = true;
        }
      }
    }
    return subfolders;
  },
  
  getTotalMessages: function(deep) {return this.nsfolder.getTotalMessages(deep);},
  
  getMessages: function(aMsgWindow) {return new gSimpleEnumerator(this.nsfolder.getMessages(aMsgWindow));},
  
  getMsgDatabase: function(aMsgWindow) {return this.nsfolder.getMsgDatabase(aMsgWindow);},
  
  getUriForMsg: function(msgHdr) { return this.nsfolder.getUriForMsg(msgHdr);},
  
  GetMessageHeader: function(msgKey) {
    try {
      var nshdr = this.nsfolder.GetMessageHeader(msgKey);
      if (!nshdr) throw Components.results.NS_ERROR_FAILURE;
      var ghdr = new gMsgDBHdr(nshdr);
      return ghdr;
    } catch (ex) {
      throw Components.results.NS_ERROR_FAILURE;
    }
  },
  
  GetOfflineStoreInputStreamAndSeek: function(offset) {
    var stream = this.nsfolder.offlineStoreInputStream;
    if (!stream) return Components.results.NS_ERROR_FAILURE;
    var seek = stream.QueryInterface(Components.interfaces.nsISeekableStream);
    if (!seek) return Components.results.NS_ERROR_FAILURE;
    seek.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, offset);
    return stream;
  },
  
  SupportsOffline: function() {
    return this.nsfolder.flags & 0x8000000;  // MSG_FOLDER_FLAG_OFFLINE
  },
  
  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIMsgFolder) &&
        !aIID.equals(Components.interfaces.nsIFolderListener) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_FAILURE;
    }
    return this;
  },
  
  nsfolder: null,
  listener: null
}


function gMsgIncomingServer(ns_server) {
  this.nsserver = ns_server;
  this.gfolder = new gMsgFolder(this.nsserver.rootFolder);
}

gMsgIncomingServer.prototype = {
  get rootFolder() {return this.gfolder;},
  get type() {return this.nsserver.type;},

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Components.interfaces.gIMsgIncomingServer) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },
  
  nsserver: null,
  gfolder: null
}


function gMsgAccount(ns_account) {
  this.nsaccount = ns_account;
  this.gserver = new gMsgIncomingServer(this.nsaccount.incomingServer);
}

gMsgAccount.prototype = {
  get incomingServer() {
    return this.gserver;
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIMsgAccount) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this
  },
  
  nsaccount: null,
  gserver: null
}

var gMsgAccountManager = 
{
  get accounts() {
    var nsIMsgAccountManager = Components.classes["@mozilla.org/messenger/account-manager;1"];
    if (!nsIMsgAccountManager) return null;
    var account_manager = nsIMsgAccountManager.getService(Components.interfaces.nsIMsgAccountManager);
    if (!account_manager) throw Components.results.NS_ERROR_FAILURE;
    var ns_accounts = account_manager.accounts;
    if (!ns_accounts) throw Components.results.NS_ERROR_FAILURE;
    var accountCount = ns_accounts.Count();
    var accounts = new gSupportsArray;

    for (var i = 0; i < accountCount; i++) {
      var ns_account = ns_accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount);
      if (ns_account && ns_account.incomingServer) {
        var gaccount = new gMsgAccount(ns_account);
        accounts.AppendElement(gaccount);
      }
    }
    return accounts;
  },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Components.interfaces.gIMsgAccountManager) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
}


var gMailSession = 
{
  AddFolderListener: function(listener) {
    try {
      this.RemoveFolderListener();
      var mailSessionContractID = "@mozilla.org/messenger/services/session;1";
      var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
      var nsIFolderListener = Components.interfaces.nsIFolderListener;
      var notifyFlags = nsIFolderListener.propertyFlagChanged | nsIFolderListener.added;
      this.listener = listener;
      mailSession.AddFolderListener(this, notifyFlags);
    } catch (ex) {
    }
  },
  
  RemoveFolderListener: function() {
    if (this.listener) {
      var mailSessionContractID = "@mozilla.org/messenger/services/session;1";
      var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
      mailSession.RemoveFolderListener(this);
      this.listener = null;
    }
  },
  
  OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {
    if (!this.listener) return;
    try {
      var hdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
      var ghdr = new gMsgDBHdr(hdr);
      this.listener.OnItemPropertyFlagChanged(ghdr, oldFlag, newFlag);
    } catch (ex) {
    }
  },
  OnItemAdded: function(parent, item) {
    if (!this.listener) return;
    try {
      var hdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
      var ghdr = new gMsgDBHdr(hdr);
      this.listener.OnItemAdded(ghdr);
    } catch (ex) {
    }
  },
  
  
  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIMailSession) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  },

  listener: null
}

var gMessengerCompose = 
{
  View: function(folder, messageId) {
    var windowwatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    
    var db = folder.getMsgDatabase(null);
    var message_header = db.getMsgHdrForMessageID(messageId);
    var uri = ioservice.newURI(folder.getUriForMsg(message_header), null, null);
    var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    str.data = folder.URI;
    
    var args = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
    args.AppendElement(uri);
    args.AppendElement(str);
    var window = windowwatcher.openWindow(null, "chrome://messenger/content/messageWindow.xul", "_blank", "all,chrome,dialog=no,status,toolbar", args);
  },

  Reply: function(folder, messageId) {
    this.HandleMessage(folder, messageId, Components.interfaces.nsIMsgCompType.Reply);
  },

  ReplyAll: function(folder, messageId) {
    this.HandleMessage(folder, messageId, Components.interfaces.nsIMsgCompType.ReplyAll);
  },

  Forward: function(folder, messageId) {
    this.HandleMessage(folder, messageId, Components.interfaces.nsIMsgCompType.ForwardInline);
  },

  HandleMessage: function(folder, messageId, type) {
    var nsIMsgComposeService = Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService);
    var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var msgComposeFormat = Components.interfaces.nsIMsgCompFormat;

    var db = folder.getMsgDatabase(null);
    var message_header = db.getMsgHdrForMessageID(messageId);
    var message_uri = folder.getUriForMsg(message_header);

    nsIMsgComposeService.OpenComposeWindow(null, message_uri, type, msgComposeFormat.Default, nsIMsgComposeService.defaultIdentity, null);
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIMessengerCompose) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  }
}

var gWebProgressListener = {
  listener : Components.classes['@google/googledesktopwebcapture;1'].getService(Components.interfaces.nsIWebProgressListener),
 
  onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus) {
    this.listener.onStateChange(aWebProgress, aRequest, aStateFlags, aStatus);
  },

  onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
    this.listener.onProgressChange(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress);
  },

  onLocationChange : function(aWebProgress, aRequest, aLocation) {
    this.listener.onLocationChange(aWebProgress, aRequest, aLocation);
  },

  onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage) {
    this.listener.onStatusChange(aWebProgress, aRequest, aStatus, aMessage);
  },

  onSecurityChange : function(aWebProgress, aRequest, aState) {
    this.listener.onSecurityChange(aWebProgress, aRequest, aState);
  },

  onLinkIconAvailable : function(browser, aHref) {},

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },
 }


function gEventHandler(window) {
  this.window = window;
}

gEventHandler.prototype = {
  onLoad:function() {
    var browser = this.window.document.getElementById("content");
    if (browser)
      browser.addProgressListener(gWebProgressListener);
  },
  
  onClose:function() {
    var browser = this.window.document.getElementById("content");
    if (browser)
      browser.removeProgressListener(gWebProgressListener);
    window = null;
  },

  window: null,
}

var gWindowWatcher = 
{
  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "xpcom-startup") {
      this.array = new Array();
      var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
      watcher.registerNotification(this);
    } else if (aTopic == "domwindowopened") {
      var window = aSubject.QueryInterface(Components.interfaces.nsIDOMWindow);
      var event_handler = new gEventHandler(window);
      window.addEventListener("load", event_handler.onLoad, false);
      this.array[this.array.length] = event_handler;
    } else if (aTopic == "domwindowclosed") {
      var window = aSubject.QueryInterface(Components.interfaces.nsIDOMWindow);
      for (i = 0; i < this.array.length; i++) {
        if (this.array[i].window == window) {
          this.array[i].onClose();
          this.array.splice(i, 1);
          i--;
        }
      }
    } else if (aTopic == "xpcom-shutdown") {
      var watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
      watcher.unregisterNotification(this);
      this.array = null;
    }
  },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIObserver) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  },
  
  array: null
}


function gCacheVisitor(visitor) {
  this.visitor = visitor;
}

gCacheVisitor.prototype = {
  visitDevice : function(deviceID, deviceInfo) {
    return true;
  },

  visitEntry : function(deviceID, entryInfo) {
    if (!this.visitor)
      return false;

    if (deviceID == "disk" && entryInfo)
      this.visitor.visitEntry(entryInfo.key, entryInfo.lastModified, entryInfo.fetchCount);

    return true;
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.nsICacheVisitor)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  },

  visitor: null
}

var gCacheService = 
{
  GetCacheSession: function() {
    var nsCacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
    return nsCacheService.createSession("HTTP", Components.interfaces.nsICache.STORE_ANYWHERE, true);
  },
  
  visitEntries: function(visitor) {
    try {
    var cache_visitor = new gCacheVisitor(visitor);
    var nsCacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
    nsCacheService.visitEntries(cache_visitor);
    } catch (ex) {
      var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                          .getService(Components.interfaces.nsIConsoleService);
      consoleService.logStringMessage("Got exception in visitEntries" + ex);
    }
  },

  IsWebPage: function(key) {
    try {
      var cache_session = this.GetCacheSession();
      var cache_descriptor = cache_session.openCacheEntry(key, Components.interfaces.nsICache.ACCESS_READ, false);
      var response;
      if (cache_descriptor != null)
        response = cache_descriptor.getMetaDataElement("response-head");
      return (response.indexOf("Content-Type: text/html") >= 0 ||
              response.indexOf("Content-Type: text/plain") >= 0);
    } catch (ex) {
      return false;
    }
  },

  GetEntryStream: function(key) {
    try {
      var cache_session = this.GetCacheSession();
      var cache_descriptor = cache_session.openCacheEntry(key, Components.interfaces.nsICache.ACCESS_READ, false);
      return cache_descriptor.openInputStream(0);
    } catch (ex) {
      throw Components.results.NS_ERROR_FAILURE;
    }
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gICacheService) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
}

var gUtility = 
{
  RemoveAllTabsButCurrent: function() {
    try {
      var window_watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
      var active_window = window_watcher.activeWindow;
      var document = active_window.document;
      var browser = document.getElementById("content");
      var current_tab = browser.mCurrentTab;
 
      if (current_tab.previousSibling) {
        browser.removeTab(current_tab.previousSibling);
      }
    } catch (ex) {
    }
  },
  
  SerializeToString: function(root) {
    var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
    if (!serializer) return Components.results.NS_ERROR_FAILURE;
    
    return serializer.serializeToString(root);
  },
  
  IsExtensionInstalled: function(guid) {
    var installed = false;
    try {
      var em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
      var loc = em.getInstallLocation(guid);
      if (loc != null)
        installed = true;
    } catch (ex) {
    }
    
    return installed;
  },
  
  QueryInterface: function(aIID) {
    if (!aIID.equals(Components.interfaces.gIUtility) &&
        !aIID.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
}

var gGoogleDesktopModule = 
{
  mObjects:
  {
    accountManager:
    {
      className:     "Google Desktop Stub Account Manager",
      contractID:    "@google/account-manager;1",
      classID:       Components.ID("37863DB5-B835-4fec-AE47-4612D2D4B36D"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
        
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
          if (!aIID.equals(Components.interfaces.gIMsgAccountManager) &&
              !aIID.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_INVALID_ARG;
          }

          return gMsgAccountManager.QueryInterface(aIID);
        },
      }
    },
    
    mailSession:
    {
      className:     "Google Desktop Stub Mail Session",
      contractID:    "@google/mailsession;1",
      classID:       Components.ID("99DB876F-80C4-4610-B987-E0D261AF519C"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
        
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
          if (!aIID.equals(Components.interfaces.gIMailSession) && 
              !aIID.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_INVALID_ARG;
          }

          return gMailSession.QueryInterface(aIID);
        },
      }
    },
    
    messengerCompose:
    {
      className:     "Google Desktop Stub Messenger Compose",
      contractID:    "@google/messengercompose;1",
      classID:       Components.ID("841BCA86-5F57-4d1e-AF32-4743C88A7ABF"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
        
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
          if (!aIID.equals(Components.interfaces.gIMessengerCompose) && 
              !aIID.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_INVALID_ARG;
          }

          return gMessengerCompose.QueryInterface(aIID);
        },
      }
    },
    
    windowWatcher:
    {
      className:     "Google Desktop Stub Window Watcher",
      contractID:    "@google/window-watcher;1",
      classID:       Components.ID("F3D6806B-973C-4699-A54D-F537AF8BA3B5"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
        
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
          if (!aIID.equals(Components.interfaces.nsIObserver) &&
              !aIID.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_INVALID_ARG;
          }

          return gWindowWatcher.QueryInterface(aIID);
        },
      }
    },

    cacheService:
    {
      className:     "Google Desktop Cache Service",
      contractID:    "@google/cacheservice;1",
      classID:       Components.ID("37BD08E3-ABE1-486f-B438-4352379E6ED1"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
        
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
          
          return gCacheService.QueryInterface(aIID);
        },
      }
    },

    utility:
    {
      className:     "Google Desktop Utility",
      contractID:    "@google/utility;1",
      classID:       Components.ID("5A6BE2C4-7D11-4f9f-8820-3588A1A175FD"),

      factory:
      {
        createInstance: function(aOuter, aIID) {
          if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
          }
         
          return gUtility.QueryInterface(aIID);
        },
      }
    }
  },
  

  getClassObject: function(aCompMgr, aCID, aIID) {
    if (!aIID.equals(Components.interfaces.nsIFactory)) {
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    }

    for (var key in this.mObjects) 
      if (aCID.equals(this.mObjects[key].classID))
        return this.mObjects[key].factory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    for (var key in this.mObjects) {
      var obj = this.mObjects[key];
      aCompMgr.registerFactoryLocation(obj.classID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
    }
    
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
    catman.addCategoryEntry("xpcom-startup", "Google Desktop Stub Window Watcher", "@google/window-watcher;1", true, true);
    catman.addCategoryEntry("xpcom-shutdown", "Google Desktop Stub Window Watcher", "@google/window-watcher;1", true, true);
  },

  unregisterSelf: function(aCompMgr, aFileSpec, aLocation) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    for (var key in this.mObjects) {
      var obj = this.mObjects[key];
      aCompMgr.unregisterFactoryLocation(obj.classID, aFileSpec);
    }
    
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
    catman.deleteCategoryEntry("xpcom-shutdown", "Google Desktop Stub Window Watcher", true);
    catman.deleteCategoryEntry("xpcom-startup", "Google Desktop Stub Window Watcher", true);
  },
  
  canUnload: function(aCompMgr) {
    return true;
  }

};

function NSGetModule(aCompMgr, aFileSpec) {
  return gGoogleDesktopModule;
}
