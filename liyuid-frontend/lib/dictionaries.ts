export type Locale = "en" | "am";

export interface Dictionary {
  common: {
    appName: string;
    tagline: string;
    subTagline: string;
    getStarted: string;
    login: string;
    signup: string;
    staffSignIn: string;
    continue: string;
    back: string;
    submit: string;
    cancel: string;
    loading: string;
  };
  welcome: {
    lostRole: string;
    foundRole: string;
    steps: {
      owner: Array<[string, string]>;
      finder: Array<[string, string]>;
    };
  };
  nav: {
    home: string;
    report: string;
    reports: string;
    matches: string;
    messages: string;
    notifications: string;
    profile: string;
    verify: string;
    handover: string;
    help: string;
    settings: string;
    signOut: string;
  };
  dashboard: {
    welcomeBack: string;
    subtitle: string;
    cityLiveNetwork: string;
    cityTitle: string;
    citySubtitle: string;
    reportLost: string;
    reportLostDesc: string;
    reportFound: string;
    reportFoundDesc: string;
    ownerBadge: string;
    finderBadge: string;
    myReports: string;
    myReportsDesc: string;
    viewAll: string;
    recentActivity: string;
    recentActivityDesc: string;
    matchingStatus: string;
    matchingDesc: string;
    activeScanning: string;
    inspectMatches: string;
    notifications: string;
    viewAllNotifications: string;
    matchingCandidate: string;
    verificationPassed: string;
    handoverReady: string;
  };
  matchesPage: {
    title: string;
    subtitle: string;
    tabMatches: string;
    tabRadar: string;
    confirmMatch: string;
    proceedHandover: string;
    startChat: string;
    dismiss: string;
    highConfidence: string;
    readyVerification: string;
    verificationPassed: string;
    radarScanning: string;
    radarSub: string;
    runScan: string;
    autoDetectedBadge: string;
    autoMatchDesc: string;
    successConfirmed: string;
    codeModalTitle: string;
    codeModalDesc: string;
    codeModalAlert: string;
    verifyAndUnlock: string;
    codeSentTo: string;
    autofillCode: string;
    cancel: string;
    invalidCode: string;
  };
  handoverPage: {
    title: string;
    subtitle: string;
    mutualProtocolTitle: string;
    mutualProtocolDesc: string;
    ownerBadge: string;
    finderBadge: string;
    ownerCodeTitle: string;
    ownerCodeDesc: string;
    finderCodeTitle: string;
    finderCodeDesc: string;
    enterFinderCode: string;
    enterOwnerCode: string;
    confirmReceived: string;
    confirmHandedOver: string;
    statusOwnerConfirmed: string;
    statusFinderConfirmed: string;
    statusPending: string;
    completedTitle: string;
    completedDesc: string;
    returnHome: string;
    validity: string;
    singleUse: string;
    safetyNotice: string;
    autofillCode: string;
    invalidCode: string;
    tapToReveal: string;
    maskedNotice: string;
    timerRemaining: string;
    regenerateCode: string;
    remaskCode: string;
    resendNewOtp: string;
    codeRegeneratedNotice: string;
  };
  notificationsPage: {
    title: string;
    subtitle: string;
    tabAll: string;
    tabSystem: string;
    tabMatches: string;
    tabHandover: string;
    emptyTitle: string;
    emptyDesc: string;
    markAllRead: string;
  };
  profile: {
    title: string;
    personalInfo: string;
    verifiedMember: string;
    upload: string;
    useInitials: string;
    fullName: string;
    emailOrPhone: string;
    location: string;
    language: string;
    notifPreferences: string;
    emailNotifs: string;
    inAppNotifs: string;
    smsNotifs: string;
    saveChanges: string;
    saved: string;
    telegramNotifs: string;
    blindPrivacyMode: string;
    autoMatchingAlerts: string;
    saveSettings: string;
    securityTitle: string;
    securityDesc: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePassword: string;
    passwordUpdated: string;
    twoFactorAuth: string;
    twoFactorDesc: string;
    activeSessions: string;
    currentSession: string;
    connectTelegram: string;
    telegramConnected: string;
    telegramBotDesc: string;
    phoneVerified: string;
    emailVerified: string;
    emailPending: string;
  };
  messagesPage: {
    title: string;
    subtitle: string;
    shieldBadge: string;
    anonymousBadge: string;
    activeFilter: string;
    onlineStatus: string;
    finderName: string;
    ownerName: string;
    typePlaceholder: string;
    send: string;
    shieldNotice: string;
    emptyChat: string;
    demoThreadFinderMsg: string;
    demoThreadOwnerMsg: string;
    demoThreadFinderTime: string;
    demoThreadOwnerTime: string;
    demoChatMsg1: string;
    demoChatMsg2: string;
  };
  reportsPage: {
    title: string;
    subtitle: string;
    newReport: string;
    tabAll: string;
    tabLost: string;
    tabFound: string;
    scanAi: string;
    matches: string;
    viewDetails: string;
    emptyTitle: string;
    emptyDesc: string;
    statusSearching: string;
    statusPossibleMatch: string;
    statusReadyHandover: string;
    statusRecovered: string;
    scanFinishedPrefix: string;
    scanFinishedSuffix: string;
    backToReports: string;
    reportNotFound: string;
    reportNotFoundDesc: string;
    publicDescLabel: string;
    privateEvidenceLabel: string;
    privateEvidenceDesc: string;
    scanAiCandidates: string;
    viewMatches: string;
    checkHandover: string;
    subcityDefault: string;
  };
  dev: {
    title: string;
    buttons: string;
    fields: string;
    indicators: string;
    chatAndCode: string;
    samplePlaceholder: string;
    sampleError: string;
    sampleHint: string;
    expiresIn: string;
    expiredLabel: string;
    regenerate: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      appName: "LIYUID",
      tagline: "Lost it? Found it? Return it safely.",
      subTagline: "Get your item back without sharing your name or phone number.",
      getStarted: "Get started",
      login: "Log in",
      signup: "Sign up",
      staffSignIn: "Staff sign in",
      continue: "Continue",
      back: "Back",
      submit: "Submit",
      cancel: "Cancel",
      loading: "Loading...",
    },
    welcome: {
      lostRole: "I lost something",
      foundRole: "I found something",
      steps: {
        owner: [
          ["Report", "Say what you lost. Type it in Amharic or English. A photo is optional."],
          ["Get matches", "LIYUID compares reports and shows likely matches with reasons."],
          ["Verify", "Add a photo and prove you know a private detail. Nothing is shown to the finder."],
          ["Hand over", "Meet safely, show the one-time code, and both confirm."],
        ],
        finder: [
          ["Report", "Say what you found. Add a private proof that only the owner can know."],
          ["Get notified", "You get a short Telegram or email alert with no personal details."],
          ["Chat", "After the owner is verified, chat with a display name only."],
          ["Hand over", "Check proof in person, then confirm the handover."],
        ],
      },
    },
    nav: {
      home: "Home",
      report: "Report",
      reports: "My Reports",
      matches: "Matches",
      messages: "Messages",
      notifications: "Notifications",
      profile: "Profile",
      verify: "Verify",
      handover: "Handover",
      help: "Help",
      settings: "Settings",
      signOut: "Sign out",
    },
    dashboard: {
      welcomeBack: "Welcome back",
      subtitle: "Here's what's happening with your items across Addis Ababa.",
      cityLiveNetwork: "Addis Ababa Live Network",
      cityTitle: "Connecting Lost & Found Across Addis",
      citySubtitle: "Privacy-first blind matching protecting your items across all 11 sub-cities.",
      reportLost: "Report Lost Item",
      reportLostDesc: "Register an item you lost with private verification attributes.",
      reportFound: "Report Found Item",
      reportFoundDesc: "Log an item you discovered to help reunite it safely with its owner.",
      ownerBadge: "Owner",
      finderBadge: "Finder",
      myReports: "My Reports",
      myReportsDesc: "Track and manage your active submissions across Addis Ababa",
      viewAll: "View all",
      recentActivity: "Recent Activity",
      recentActivityDesc: "Live events across your case files",
      matchingStatus: "Matching Status",
      matchingDesc: "Dual-blind vector search scanning reported items across Addis Ababa.",
      activeScanning: "Active Scanning",
      inspectMatches: "Inspect Matches",
      notifications: "Notifications",
      viewAllNotifications: "View all notifications →",
      matchingCandidate: "High-confidence match candidate found",
      verificationPassed: "Verification Passed",
      handoverReady: "Ready for Handover",
    },
    matchesPage: {
      title: "AI Matches & Auto-Detection",
      subtitle: "Items automatically detected and paired by LIYUID's AI engine across Addis Ababa.",
      tabMatches: "Active Matches",
      tabRadar: "Live AI Radar",
      confirmMatch: "Confirm This Is My Item",
      proceedHandover: "Proceed to Handover",
      startChat: "Open Shielded Chat",
      dismiss: "Not My Item",
      highConfidence: "Match Confidence",
      readyVerification: "AI Auto-Detected",
      verificationPassed: "Confirmed & Verified",
      radarScanning: "Searching for potential matches...",
      radarSub: "Dual-blind vector search active across all 11 sub-cities.",
      runScan: "Run AI Matching Scan",
      autoDetectedBadge: "Auto-Detected",
      autoMatchDesc: "LIYUID's AI auto-detector paired this report with high confidence based on category, model, and location.",
      successConfirmed: "Match confirmed! Shielded chat and secure handover are now unlocked.",
      codeModalTitle: "Confirm Item Ownership",
      codeModalDesc: "To confirm this match and unlock shielded chat & handover, enter the 6-digit confirmation code sent to your account.",
      codeModalAlert: "LIYUID Security Alert: Your match confirmation code is",
      verifyAndUnlock: "Verify Code & Unlock",
      codeSentTo: "Code sent via Telegram / SMS / In-App Notification",
      autofillCode: "Auto-fill Code",
      cancel: "Cancel",
      invalidCode: "Invalid code. Please enter the 6-digit confirmation code.",
    },
    handoverPage: {
      title: "Two-Sided Handover Verification",
      subtitle: "Mutual OTP interchange: Both owner and finder exchange codes to confirm physical return.",
      mutualProtocolTitle: "Dual-Party Code Interchange Protocol",
      mutualProtocolDesc: "To prevent fraud, both parties receive a unique OTP code from the system. You must interchange codes in person to complete the handover.",
      ownerBadge: "Owner View",
      finderBadge: "Finder View",
      ownerCodeTitle: "Your Owner Code (Give to Finder)",
      ownerCodeDesc: "Show this code to the finder once you physically receive and inspect your item.",
      finderCodeTitle: "Your Finder Code (Give to Owner)",
      finderCodeDesc: "Show this code to the owner when handing over the item.",
      enterFinderCode: "Enter Finder's Code to Confirm Receipt",
      enterOwnerCode: "Enter Owner's Code to Confirm Return",
      confirmReceived: "Confirm Item Received",
      confirmHandedOver: "Confirm Item Returned",
      statusOwnerConfirmed: "Owner Confirmed",
      statusFinderConfirmed: "Finder Confirmed",
      statusPending: "Pending Code",
      completedTitle: "Mutual Handover Successfully Completed!",
      completedDesc: "Both owner and finder interchanged and verified their OTP codes. The case is now officially closed and resolved.",
      returnHome: "Return to Dashboard",
      validity: "Valid for 15 minutes",
      singleUse: "(Single Use Cryptographic OTP)",
      safetyNotice: "For safety, complete handovers at certified public desks or partner stations across Addis Ababa.",
      autofillCode: "Auto-fill Opposite Code",
      invalidCode: "Invalid code. Please enter the exact 6-digit code provided by the other party.",
      tapToReveal: "Tap to Reveal OTP Code",
      maskedNotice: "Keep code hidden until you meet in person. Revealing starts the 15-minute countdown.",
      timerRemaining: "Remaining",
      regenerateCode: "Regenerate Expired Code",
      remaskCode: "Re-mask & Pause",
      resendNewOtp: "Re-send / Generate New OTP",
      codeRegeneratedNotice: "Previous code invalidated. Fresh 15-minute OTP generated.",
    },
    notificationsPage: {
      title: "Notifications",
      subtitle: "Stay updated on AI auto-matches, shielded chats, and handover progress across Addis Ababa.",
      tabAll: "All",
      tabSystem: "System",
      tabMatches: "Matches",
      tabHandover: "Handover",
      emptyTitle: "No notifications in this category",
      emptyDesc: "You will be alerted here when new activity occurs.",
      markAllRead: "Mark all as read",
    },
    profile: {
      title: "Profile Settings",
      personalInfo: "Personal Information",
      verifiedMember: "Verified Member",
      upload: "Upload",
      useInitials: "Use Initials",
      fullName: "Full name",
      emailOrPhone: "Email or phone",
      location: "Location",
      language: "Language",
      notifPreferences: "Notification Preferences",
      emailNotifs: "Email notifications",
      inAppNotifs: "In-app notifications",
      smsNotifs: "SMS notifications",
      saveChanges: "Save Changes",
      saved: "Profile updated successfully",
      telegramNotifs: "Telegram instant alerts (@liyuid_alert_bot)",
      blindPrivacyMode: "Blind Privacy Shield (Hide personal name in public searches)",
      autoMatchingAlerts: "Instant AI Auto-Match alerts",
      saveSettings: "Save Preferences",
      securityTitle: "Account Security & Credentials",
      securityDesc: "Manage your password, login sessions, and two-factor authentication.",
      changePassword: "Change Password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      updatePassword: "Update Password",
      passwordUpdated: "Password updated successfully!",
      twoFactorAuth: "Two-Factor Authentication (OTP)",
      twoFactorDesc: "Requires single-use OTP verification via SMS or Telegram during sign in.",
      activeSessions: "Active Logged-in Devices",
      currentSession: "Current Browser Session • Addis Ababa, Ethiopia",
      connectTelegram: "Connect @liyuid_alert_bot on Telegram",
      telegramConnected: "Telegram Bot connected & active",
      telegramBotDesc: "Receive instant alert pings and 6-digit handover OTPs with zero PII leaks.",
      phoneVerified: "Phone Verified",
      emailVerified: "Email Verified",
      emailPending: "Verification Pending",
    },
    messagesPage: {
      title: "Messages",
      subtitle: "Shielded communication with verified finders and owners.",
      shieldBadge: "End-to-End Shielded",
      anonymousBadge: "Identity Protected",
      activeFilter: "Active",
      onlineStatus: "Online",
      finderName: "Finder",
      ownerName: "Owner",
      typePlaceholder: "Type a shielded message...",
      send: "Send",
      shieldNotice: "Phone numbers and private contact details remain protected.",
      emptyChat: "Select a conversation to start chatting",
      demoThreadFinderMsg: "Hello! I think I may have found your item.",
      demoThreadOwnerMsg: "Thank you for the update.",
      demoThreadFinderTime: "2m ago",
      demoThreadOwnerTime: "1h ago",
      demoChatMsg1: "Hi, I think I may have found your item. It looks very similar to your description.",
      demoChatMsg2: "Thanks! Could you please confirm the details?",
    },
    reportsPage: {
      title: "My Recovery Reports",
      subtitle: "Track and manage your lost and found submissions across Addis Ababa.",
      newReport: "New Report",
      tabAll: "All",
      tabLost: "Lost",
      tabFound: "Found",
      scanAi: "Scan AI",
      matches: "Matches",
      viewDetails: "View Report Details",
      emptyTitle: "No reports in this view",
      emptyDesc: "You have no active reports matching this category filter. Click 'New Report' to register an item.",
      statusSearching: "Searching...",
      statusPossibleMatch: "Possible Match",
      statusReadyHandover: "Ready for Handover",
      statusRecovered: "Recovered",
      scanFinishedPrefix: "AI matching scan finished:",
      scanFinishedSuffix: "candidate(s) evaluated.",
      backToReports: "Back to My Reports",
      reportNotFound: "Report Not Found",
      reportNotFoundDesc: "The requested report could not be found or has been archived.",
      publicDescLabel: "Public Appearance Description",
      privateEvidenceLabel: "Private Ownership Evidence",
      privateEvidenceDesc: "Encrypted at rest · Sealed for blind asymmetric verification",
      scanAiCandidates: "Scan AI Candidates",
      viewMatches: "View Matches",
      checkHandover: "Check Recovery Handover Status",
      subcityDefault: "Addis Ababa",
    },
    dev: {
      title: "UI Component Showcase",
      buttons: "Buttons & Status Badges",
      fields: "Input Fields & Redaction",
      indicators: "Score Rings, Signals & Steps",
      chatAndCode: "Chat Bubbles & Code Display",
      samplePlaceholder: "Enter sample value...",
      sampleError: "This field has an error",
      sampleHint: "Helper text for the input field",
      expiresIn: "Expires in",
      expiredLabel: "Expired",
      regenerate: "Get a new code",
    },
  },
  am: {
    common: {
      appName: "ሊዩይድ",
      tagline: "የጠፋ እቃ፣ በደህና ይመለሳል።",
      subTagline: "ስምዎን ወይም ስልክዎን ሳያጋሩ እቃዎን ይመልሱ።",
      getStarted: "ጀምር",
      login: "ግባ",
      signup: "ተመዝገብ",
      staffSignIn: "የሰራተኞች መግቢያ",
      continue: "ቀጥል",
      back: "ተመለስ",
      submit: "ላክ",
      cancel: "ሰርዝ",
      loading: "በመጫን ላይ...",
    },
    welcome: {
      lostRole: "እቃ ጠፍቶብኛል",
      foundRole: "እቃ አግኝቻለሁ",
      steps: {
        owner: [
          ["ሪፖርት ማድረግ", "ስለ ጠፋው እቃ መረጃ ይስጡ። በአማርኛ ወይም በእንግሊዝኛ መጻፍ ይችላሉ።"],
          ["ተመሳሳይ እቃዎችን ማየት", "ስርዓቱ ሪፖርቶችን በማነጻጸር የሚቀራረቡትን ምክንያቶች ጭምር ያሳያል።"],
          ["ማረጋገጥ", "የእቃውን ፎቶ በማከል እና ባለቤት መሆንዎን የሚያረጋግጥ ምስጢር በመመለስ ያረጋግጡ።"],
          ["ርክክብ", "በአስተማማኝ ቦታ በመገናኘት የአንድ ጊዜ ኮድ ያሳዩ እና ሁለታችሁም አረጋግጡ።"],
        ],
        finder: [
          ["ሪፖርት ማድረግ", "ያገኙትን እቃ ይመዝግቡ። ባለቤቱ ብቻ ሊያውቀው የሚችል ምስጢራዊ ዝርዝር ያክሉ።"],
          ["ማሳወቂያ ማግኘት", "ምንም አይነት የግል መረጃ የሌለበት አጭር የቴሌግራም ወይም የኢሜይል ማሳወቂያ ይደርስዎታል።"],
          ["ውይይት", "የእቃው ባለቤት ማንነቱ ከተረጋገጠ በኋላ በመጠሪያ ስም ብቻ ሚስጥራዊ ውይይት ይጀምሩ።"],
          ["ርክክብ", "በአካል ሲገናኙ መረጃውን ያረጋግጡ እና ርክክቡን በስርዓቱ ላይ ያረጋግጡ።"],
        ],
      },
    },
    nav: {
      home: "መነሻ",
      report: "ሪፖርት",
      reports: "ሪፖርቶቼ",
      matches: "ተዛማጆች",
      messages: "መልዕክቶች",
      notifications: "ማሳወቂያዎች",
      profile: "መገለጫ",
      verify: "አረጋግጥ",
      handover: "ርክክብ",
      help: "እገዛ",
      settings: "ቅንብሮች",
      signOut: "ውጣ",
    },
    dashboard: {
      welcomeBack: "እንኳን ደህና መጡ",
      subtitle: "በአዲስ አበባ ውስጥ ስለ እቃዎችዎ ወቅታዊ መረጃ እዚህ አለ።",
      cityLiveNetwork: "የአዲስ አበባ የቀጥታ ኔትወርክ",
      cityTitle: "የጠፉ እና የተገኙ እቃዎችን በመላው አዲስ አበባ ማገናኘት",
      citySubtitle: "በሁሉም 11 ክፍለ ከተሞች ውስጥ የግል መረጃዎን በመጠበቅ የሚሰራ ዘመናዊ አሰራር።",
      reportLost: "የጠፋ እቃ ሪፖርት ያድርጉ",
      reportLostDesc: "የጠፋብዎትን እቃ በሚስጥራዊ የማረጋገጫ ዝርዝሮች እዚህ ይመዝግቡ።",
      reportFound: "የተገኘ እቃ ሪፖርት ያድርጉ",
      reportFoundDesc: "ያገኙትን እቃ ለባለቤቱ በሰላም ለማድረስ እዚህ ይመዝግቡ።",
      ownerBadge: "ባለቤት",
      finderBadge: "አግኚ",
      myReports: "የእኔ ሪፖርቶች",
      myReportsDesc: "በአዲስ አበባ ውስጥ ያቀረቧቸውን ንቁ ሪፖርቶች ይከታተሉ",
      viewAll: "ሁሉንም ይመልከቱ",
      recentActivity: "የቅርብ ጊዜ እንቅስቃሴዎች",
      recentActivityDesc: "በጉዳዮችዎ ላይ የተከናወኑ የቀጥታ ክስተቶች",
      matchingStatus: "የተዛማጅነት ሁኔታ",
      matchingDesc: "በመላው አዲስ አበባ የተመዘገቡ እቃዎችን በምስጢራዊ የቬክተር ፍተሻ ማወዳደር።",
      activeScanning: "ንቁ ፍተሻ",
      inspectMatches: "ተዛማጆችን ይመልከቱ",
      notifications: "ማሳወቂያዎች",
      viewAllNotifications: "ሁሉንም ማሳወቂያዎች ይመልከቱ →",
      matchingCandidate: "ከፍተኛ ተቀራራቢነት ያለው እቃ ተገኝቷል",
      verificationPassed: "ማረጋገጫው ተሳክቷል",
      handoverReady: "ለርክክብ ዝግጁ ነው",
    },
    matchesPage: {
      title: "የተዛመዱ እቃዎች እና ራስ-ሰር ፈላጊ",
      subtitle: "በአርቴፊሻል ኢንተለጀንስ ራስ-ሰር ፈላጊ በመላው አዲስ አበባ የተዛመዱ እቃዎች።",
      tabMatches: "ንቁ ተዛማጆች",
      tabRadar: "የቀጥታ ፍተሻ ራዳር",
      confirmMatch: "ይህ የእኔ እቃ መሆኑን አረጋግጥ",
      proceedHandover: "ወደ ርክክብ ሂድ",
      startChat: "ሚስጥራዊ ውይይት ጀምር",
      dismiss: "የእኔ እቃ አይደለም",
      highConfidence: "የተዛማጅነት ደረጃ",
      readyVerification: "በAI ራስ-ሰር የተገኘ",
      verificationPassed: "የተረጋገጠ ግጥጥሞሽ",
      radarScanning: "ተቀራራቢ እቃዎች በመፈለግ ላይ...",
      radarSub: "በሁሉም 11 ክፍለ ከተሞች ውስጥ ሚስጥራዊ የቬክተር ፍተሻ በመካሄድ ላይ ነው።",
      runScan: "አዲስ ፍተሻ አከናውን",
      autoDetectedBadge: "በAI የተገኘ",
      autoMatchDesc: "የሊዩይድ AI ራስ-ሰር ፈላጊ ይህንን እቃ በምድብ፣ በሞዴል እና በአካባቢ ከፍተኛ ተዛማጅነት አግኝቶታል።",
      successConfirmed: "ግጥጥሞሹ ተረጋግጧል! ሚስጥራዊ ውይይት እና ደህንነቱ የተጠበቀ ርክክብ አሁን ክፍት ሆነዋል።",
      codeModalTitle: "የእቃ ባለቤትነት ማረጋገጫ",
      codeModalDesc: "ይህ የእርስዎ እቃ መሆኑን ለማረጋገጥ እና ውይይት እንዲሁም ርክክብ ለመክፈት ወደ መለያዎ የተላከውን ባለ 6-አሃዝ ኮድ ያስገቡ።",
      codeModalAlert: "የሊዩይድ ደህንነት ማሳወቂያ፡ የማረጋገጫ ኮድዎ",
      verifyAndUnlock: "ኮዱን አረጋግጥ እና ክፈት",
      codeSentTo: "ኮዱ በቴሌግራም / በSMS / በማሳወቂያ ተልኳል",
      autofillCode: "ኮዱን በራስ-ሰር አስገባ",
      cancel: "ተመለስ",
      invalidCode: "የተሳሳተ ኮድ። እባክዎ የተላከውን ባለ 6-አሃዝ ኮድ ያስገቡ።",
    },
    handoverPage: {
      title: "የሁለትዮሽ የርክክብ ማረጋገጫ",
      subtitle: "የሁለት ወገን የOTP ልውውጥ፡ ባለቤቱም አግኚውም ኮዶችን ተለዋውጠው ርክክቡን ያረጋግጣሉ።",
      mutualProtocolTitle: "የሁለት ወገን የኮድ ልውውጥ መመሪያ",
      mutualProtocolDesc: "ማጭበርበርን ለመከላከል ሁለቱም ወገኖች ከሲስተሙ የተለየ የOTP ኮድ ይቀበላሉ። ርክክቡን ለማጠናቀቅ ኮዶቻችሁን በአካል መለዋወጥ አለባችሁ።",
      ownerBadge: "የባለቤት እይታ",
      finderBadge: "የአግኚ እይታ",
      ownerCodeTitle: "የባለቤት ኮድዎ (ለአግኚው የሚሰጥ)",
      ownerCodeDesc: "እቃውን በአካል ተቀብለው ካረጋገጡ በኋላ ይህንን ኮድ ለአግኚው ይስጡት።",
      finderCodeTitle: "የአግኚ ኮድዎ (ለባለቤቱ የሚሰጥ)",
      finderCodeDesc: "እቃውን ለባለቤቱ ሲያስረክቡ ይህንን ኮድ ያሳዩት።",
      enterFinderCode: "የአግኚውን ኮድ አስገብተው መቀበልዎን ያረጋግጡ",
      enterOwnerCode: "የባለቤቱን ኮድ አስገብተው ማስረከብዎን ያረጋግጡ",
      confirmReceived: "እቃውን መቀበሌን አረጋግጣለሁ",
      confirmHandedOver: "እቃውን ማስረከቤን አረጋግጣለሁ",
      statusOwnerConfirmed: "ባለቤቱ አረጋግጧል",
      statusFinderConfirmed: "አግኚው አረጋግጧል",
      statusPending: "ኮድ በመጠባበቅ ላይ",
      completedTitle: "የሁለትዮሽ ርክክብ በተሳካ ሁኔታ ተጠናቋል!",
      completedDesc: "ባለቤቱም አግኚውም የOTP ኮዶቻቸውን ተለዋውጠው አረጋግጠዋል። ጉዳዩ በይፋ ተዘግቷል።",
      returnHome: "ወደ ዳሽቦርድ ተመለስ",
      validity: "ለ15 ደቂቃዎች ይሰራል",
      singleUse: "(አንድ ጊዜ ብቻ የሚያገለግል የተመሰጠረ OTP)",
      safetyNotice: "ለደህንነትዎ፣ ርክክብን በመላው አዲስ አበባ በሚገኙ ህዝባዊ ቦታዎች ወይም የፖሊስ ጣቢያዎች አጠገብ ያከናውኑ።",
      autofillCode: "የተቃራኒውን ኮድ በራስ-ሰር አስገባ",
      invalidCode: "የተሳሳተ ኮድ። እባክዎ ከሌላኛው ወገን የተሰጠዎትን ትክክለኛ ባለ 6-አሃዝ ኮድ ያስገቡ።",
      tapToReveal: "የርክክብ ኮዱን ለማየት ይጫኑ",
      maskedNotice: "በአካል እስክትገናኙ ድረስ ኮዱን ደብቀው ያቆዩ። ኮዱ ሲገለጥ የ15 ደቂቃ ቆጣሪው ይጀምራል።",
      timerRemaining: "ቀሪ ጊዜ",
      regenerateCode: "አዲስ ኮድ ፍጠር",
      remaskCode: "መልሰህ ደብቅ እና አቆይ",
      resendNewOtp: "አዲስ OTP በድጋሚ ላክ",
      codeRegeneratedNotice: "የቀደመው ኮድ ተሰርዟል። አዲስ የ15 ደቂቃ OTP ተፈጥሯል።",
    },
    notificationsPage: {
      title: "ማሳወቂያዎች",
      subtitle: "ስለ AI ራስ-ሰር ተዛማጆች፣ ሚስጥራዊ ውይይቶች እና የርክክብ ሂደት ወቅታዊ መረጃ ያግኙ።",
      tabAll: "ሁሉም",
      tabSystem: "የሲስተም",
      tabMatches: "ተዛማጆች",
      tabHandover: "ርክክብ",
      emptyTitle: "በዚህ ምድብ ውስጥ ምንም ማሳወቂያ የለም",
      emptyDesc: "አዳዲስ ክስተቶች ሲኖሩ እዚህ ይደርስዎታል።",
      markAllRead: "ሁሉንም እንደተነበቡ ምልክት አድርግ",
    },
    profile: {
      title: "የመገለጫ ቅንብሮች",
      personalInfo: "የግል መረጃ",
      verifiedMember: "የተረጋገጠ አባል",
      upload: "ፎቶ ቀይር",
      useInitials: "በፊደላት ተጠቀም",
      fullName: "ሙሉ ስም",
      emailOrPhone: "ኢሜይል ወይም ስልክ",
      location: "አድራሻ",
      language: "ቋንቋ",
      notifPreferences: "የማሳወቂያ ምርጫዎች",
      emailNotifs: "የኢሜይል ማሳወቂያዎች",
      inAppNotifs: "የመተግበሪያ ውስጥ ማሳወቂያዎች",
      smsNotifs: "የአጭር የጽሁፍ መልዕክት (SMS) ማሳወቂያዎች",
      saveChanges: "ለውጦችን መዝግብ",
      saved: "መገለጫዎ በተሳካ ሁኔታ ተዘምኗል",
      telegramNotifs: "የቴሌግራም ፈጣን ማሳወቂያዎች (@liyuid_alert_bot)",
      blindPrivacyMode: "ስም-አልባ የግል ጥበቃ (በፍለጋ ወቅት ስም እንዳይታይ መደበቅ)",
      autoMatchingAlerts: "የAI ራስ-ሰር ተዛማጅ ማንቂያዎች",
      saveSettings: "ምርጫዎችን መዝግብ",
      securityTitle: "የመለያ ደህንነት እና ምስጢራዊ ቁልፎች",
      securityDesc: "የይለፍ ቃልዎን፣ የመግቢያ ክፍለ-ጊዜዎችን እና ባለሁለት ደረጃ ማረጋገጫን ያስተዳድሩ።",
      changePassword: "የይለፍ ቃል ቀይር",
      currentPassword: "የአሁኑ የይለፍ ቃል",
      newPassword: "አዲስ የይለፍ ቃል",
      confirmNewPassword: "አዲሱን የይለፍ ቃል በድጋሚ አስገባ",
      updatePassword: "የይለፍ ቃል አዘምን",
      passwordUpdated: "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!",
      twoFactorAuth: "ባለሁለት ደረጃ ማረጋገጫ (OTP)",
      twoFactorDesc: "በመግቢያ ወቅት በSMS ወይም በቴሌግራም የአንድ ጊዜ ማረጋገጫ ኮድ ይጠይቃል።",
      activeSessions: "ገባሪ የተገናኙ መሳሪያዎች",
      currentSession: "የአሁኑ የብሮውዘር ክፍለ-ጊዜ • አዲስ አበባ፣ ኢትዮጵያ",
      connectTelegram: "የቴሌግራም ቦትን አገናኝ (@liyuid_alert_bot)",
      telegramConnected: "የቴሌግራም ቦት ተገናኝቷል እና ገባሪ ነው",
      telegramBotDesc: "ምንም አይነት የግል መረጃ ሳይጋራ ፈጣን የቴሌግራም ማንቂያዎችን እና የርክክብ OTP ኮዶችን ያግኙ።",
      phoneVerified: "ስልክ ቁጥር ተረጋግጧል",
      emailVerified: "ኢሜይል ተረጋግጧል",
      emailPending: "ማረጋገጫ በመጠባበቅ ላይ",
    },
    messagesPage: {
      title: "መልዕክቶች",
      subtitle: "ከተረጋገጡ አግኚዎች እና ባለቤቶች ጋር ደህንነቱ የተጠበቀ ውይይት።",
      shieldBadge: "የተመሰጠረ የግል ጥበቃ",
      anonymousBadge: "ማንነት ያልተገለጸ",
      activeFilter: "ንቁ",
      onlineStatus: "በመስመር ላይ",
      finderName: "አግኚ",
      ownerName: "ባለቤት",
      typePlaceholder: "የተጠበቀ መልዕክት እዚህ ይጻፉ...",
      send: "ላክ",
      shieldNotice: "ስልክ ቁጥር እና የግል መረጃዎች በሚስጥር የተጠበቁ ናቸው።",
      emptyChat: "ውይይት ለመጀመር አንዱን ይምረጡ",
      demoThreadFinderMsg: "ሰላም! የእርስዎ የሆነውን እቃ ያገኘሁት ይመስለኛል።",
      demoThreadOwnerMsg: "ስለ መረጃው አመሰግናለሁ።",
      demoThreadFinderTime: "ከ2 ደቂቃ በፊት",
      demoThreadOwnerTime: "ከ1 ሰዓት በፊት",
      demoChatMsg1: "ሰላም፣ የእርስዎ የሆነውን እቃ ያገኘሁት ይመስለኛል። ከመግለጫዎ ጋር በጣም ይመሳሰላል።",
      demoChatMsg2: "አመሰግናለሁ! እባክዎ የተወሰኑ ዝርዝሮችን ማረጋገጥ ይችላሉ?",
    },
    reportsPage: {
      title: "የእኔ የሪፖርቶች ዝርዝር",
      subtitle: "በመላው አዲስ አበባ የተመዘገቡ የጠፉ እና የተገኙ እቃዎችዎን ይከታተሉ።",
      newReport: "አዲስ ሪፖርት",
      tabAll: "ሁሉም",
      tabLost: "የጠፉ",
      tabFound: "የተገኙ",
      scanAi: "በAI ፈልግ",
      matches: "ተዛማጆች",
      viewDetails: "የሪፖርቱን ዝርዝር ይመልከቱ",
      emptyTitle: "በዚህ ምድብ ውስጥ ምንም ሪፖርት የለም",
      emptyDesc: "በዚህ ምድብ ውስጥ ምንም አይነት ሪፖርት አልተገኘም። እቃ ለመመዝገብ 'አዲስ ሪፖርት' የሚለውን ይጫኑ።",
      statusSearching: "በመፈለግ ላይ...",
      statusPossibleMatch: "ሊሆን የሚችል ተዛማጅ",
      statusReadyHandover: "ለርክክብ ዝግጁ",
      statusRecovered: "ተረክቧል",
      scanFinishedPrefix: "የAI ፍተሻ ተጠናቋል፡",
      scanFinishedSuffix: "እጩ እቃዎች ተገምግመዋል።",
      backToReports: "ወደ ሪፖርቶች ተመለስ",
      reportNotFound: "ሪፖርቱ አልተገኘም",
      reportNotFoundDesc: "የተጠየቀው ሪፖርት ሊገኝ አልቻለም ወይም ወደ ማህደር ተዛውሯል።",
      publicDescLabel: "የእቃው ውጫዊ ገጽታ መግለጫ",
      privateEvidenceLabel: "የባለቤትነት ሚስጥራዊ ማስረጃ",
      privateEvidenceDesc: "በሚስጥር የተመሰጠረ · ለደህንነቱ የተጠበቀ ማረጋገጫ የታሸገ",
      scanAiCandidates: "በAI ተዛማጆችን ፈልግ",
      viewMatches: "ተዛማጆችን ይመልከቱ",
      checkHandover: "የርክክብ ሁኔታን ተመልከት",
      subcityDefault: "አዲስ አበባ",
    },
    dev: {
      title: "የክፍሎች ማሳያ (Showcase)",
      buttons: "አዝራሮች እና ሁኔታዎች",
      fields: "የግቤት መስኮች እና ድብቅ ዝርዝሮች",
      indicators: "ውጤቶች እና ደረጃዎች",
      chatAndCode: "ውይይት እና የርክክብ ኮድ",
      samplePlaceholder: "ናሙና እሴት ያስገቡ...",
      sampleError: "ይህ መስክ ስህተት አለበት",
      sampleHint: "የግቤት መስክ አጋዥ መረጃ",
      expiresIn: "የሚያበቃበት ጊዜ",
      expiredLabel: "ጊዜው አልፏል",
      regenerate: "አዲስ ኮድ ጠይቅ",
    },
  },
};
