import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var userStore: UserStore
    @State private var newKeyword = ""
    @State private var apiKeyInput = ""
    @State private var showResetConfirm = false

    var body: some View {
        NavigationStack {
            List {
                interestsSection
                keywordsSection
                gnewsSection
                resetSection
                aboutSection
            }
            .navigationTitle("設定")
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .confirmationDialog(
                "学習データをリセットしますか？",
                isPresented: $showResetConfirm,
                titleVisibility: .visible
            ) {
                Button("リセット", role: .destructive) {
                    userStore.resetLearningData()
                }
            }
            .onAppear { apiKeyInput = userStore.profile.gnewsAPIKey }
        }
    }

    private var interestsSection: some View {
        Section {
            ForEach(NewsCategory.allCases) { category in
                Button {
                    var interests = userStore.profile.interests
                    if interests.contains(category) {
                        interests.remove(category)
                    } else {
                        interests.insert(category)
                    }
                    userStore.setInterests(interests)
                } label: {
                    HStack {
                        Label(category.displayName, systemImage: category.icon)
                            .foregroundStyle(Theme.textPrimary)
                        Spacer()
                        if userStore.profile.interests.contains(category) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Theme.accent)
                        }
                    }
                }
            }
            .listRowBackground(Theme.surface)
        } header: {
            Text("興味のあるジャンル")
        } footer: {
            Text("選んだジャンルの記事が「おすすめ」で優先表示されます。")
        }
    }

    private var keywordsSection: some View {
        Section {
            ForEach(userStore.profile.followedKeywords, id: \.self) { keyword in
                Text(keyword).foregroundStyle(Theme.textPrimary)
            }
            .onDelete { indexSet in
                let keywords = userStore.profile.followedKeywords
                for index in indexSet {
                    userStore.removeKeyword(keywords[index])
                }
            }
            .listRowBackground(Theme.surface)
            HStack {
                TextField("キーワードを追加", text: $newKeyword)
                Button("追加") {
                    userStore.addKeyword(newKeyword)
                    newKeyword = ""
                }
                .disabled(
                    newKeyword.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                )
            }
            .listRowBackground(Theme.surface)
        } header: {
            Text("フォロー中のキーワード")
        } footer: {
            Text("タイトルにキーワードを含む記事を大きく優先します。左にスワイプで削除できます。")
        }
    }

    private var gnewsSection: some View {
        Section {
            HStack {
                SecureField("GNews APIキー（任意）", text: $apiKeyInput)
                Button("保存") {
                    userStore.setGNewsAPIKey(apiKeyInput)
                }
                .disabled(apiKeyInput == userStore.profile.gnewsAPIKey)
            }
            .listRowBackground(Theme.surface)
        } header: {
            Text("Web検索（GNews API）")
        } footer: {
            Text("gnews.io で無料のAPIキーを取得すると、検索タブでWeb全体のニュースを検索できます。未設定でもYahoo!ニュースの閲覧には影響ありません。")
        }
    }

    private var resetSection: some View {
        Section {
            Button("学習データをリセット", role: .destructive) {
                showResetConfirm = true
            }
            .listRowBackground(Theme.surface)
        } footer: {
            Text("「いいね」「興味なし」「閲覧履歴」から学習したおすすめの重み付けを初期化します。ブックマークは残ります。")
        }
    }

    private var aboutSection: some View {
        Section {
            HStack {
                Text("データソース").foregroundStyle(Theme.textPrimary)
                Spacer()
                Text("Yahoo!ニュース RSS").foregroundStyle(Theme.textSecondary)
            }
            .listRowBackground(Theme.surface)
            HStack {
                Text("バージョン").foregroundStyle(Theme.textPrimary)
                Spacer()
                Text("1.0").foregroundStyle(Theme.textSecondary)
            }
            .listRowBackground(Theme.surface)
        }
    }
}
