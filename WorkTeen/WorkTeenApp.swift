//
//  WorkTeenApp.swift
//  WorkTeen
//
//  IMPORTANT — GoogleService-Info.plist placement:
//  ─────────────────────────────────────────────
//  1. Download GoogleService-Info.plist from the Firebase console
//     (Project settings → Your apps → iOS app → Download config file).
//  2. Drag it into the WorkTeen/WorkTeen/ folder in Xcode's Project Navigator
//     (the folder that contains ContentView.swift and WorkTeenApp.swift).
//  3. In the "Add to targets" sheet that appears, make sure "WorkTeen" is checked.
//  4. Do NOT add it to .gitignore — or do, your call — but the file MUST be
//     present in the app bundle at runtime for FirebaseApp.configure() to work.
//  ─────────────────────────────────────────────
//

import SwiftUI
import FirebaseCore

@main
struct WorkTeenApp: App {

    init() {
        // Reads GoogleService-Info.plist from the app bundle and connects to Firebase.
        // This must be called before any Firestore access.
        // Guard: only configure if the plist is present — avoids a crash when the file
        // hasn't been added to the bundle yet during development.
        if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
            FirebaseApp.configure()
        } else {
            print("⚠️ WorkTeen: GoogleService-Info.plist not found in bundle. " +
                  "Add it to the WorkTeen target in Xcode. Firestore will not connect.")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
