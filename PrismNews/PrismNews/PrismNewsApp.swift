import SwiftUI

@main
struct PrismNewsApp: App {
    @StateObject private var newsStore = NewsStore()
    @StateObject private var userStore = UserStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(newsStore)
                .environmentObject(userStore)
                .preferredColorScheme(.dark)
                .tint(Theme.accent)
        }
    }
}
