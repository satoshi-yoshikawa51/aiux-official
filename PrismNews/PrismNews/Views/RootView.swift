import SwiftUI

struct RootView: View {
    @EnvironmentObject private var newsStore: NewsStore
    @EnvironmentObject private var userStore: UserStore

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("ニュース", systemImage: "newspaper.fill") }
            SearchView()
                .tabItem { Label("検索", systemImage: "magnifyingglass") }
            BookmarksView()
                .tabItem { Label("あとで読む", systemImage: "bookmark.fill") }
            SettingsView()
                .tabItem { Label("設定", systemImage: "gearshape.fill") }
        }
        .fullScreenCover(isPresented: onboardingBinding) {
            OnboardingView()
        }
        .task { await newsStore.refreshAll() }
    }

    private var onboardingBinding: Binding<Bool> {
        Binding(
            get: { !userStore.profile.hasOnboarded },
            set: { _ in }
        )
    }
}
