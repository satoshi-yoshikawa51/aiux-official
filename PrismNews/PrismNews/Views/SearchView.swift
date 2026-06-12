import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var newsStore: NewsStore
    @EnvironmentObject private var userStore: UserStore
    @State private var query = ""
    @State private var remoteResults: [Article] = []
    @State private var isSearching = false
    @State private var openedArticle: Article?

    private var trimmedQuery: String {
        query.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var localResults: [Article] {
        guard !trimmedQuery.isEmpty else { return [] }
        return newsStore.allArticles.filter {
            $0.title.localizedCaseInsensitiveContains(trimmedQuery)
        }
    }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                searchField
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        if trimmedQuery.isEmpty {
                            suggestions
                        } else {
                            results
                        }
                    }
                    .padding(.bottom, 24)
                }
            }
        }
        .sheet(item: $openedArticle) { article in
            SafariView(url: article.link).ignoresSafeArea()
        }
        .task(id: query) {
            remoteResults = []
            let key = userStore.profile.gnewsAPIKey
            let q = trimmedQuery
            guard q.count >= 2, !key.isEmpty else { return }
            // 入力が落ち着くまで待つ（デバウンス）
            try? await Task.sleep(for: .milliseconds(500))
            if Task.isCancelled { return }
            isSearching = true
            remoteResults = (try? await GNewsService(apiKey: key).search(query: q)) ?? []
            isSearching = false
        }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(Theme.textSecondary)
            TextField("キーワードで探す", text: $query)
                .foregroundStyle(Theme.textPrimary)
                .submitLabel(.search)
            if !query.isEmpty {
                Button {
                    query = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Theme.surface)
        )
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 6)
    }

    @ViewBuilder
    private var suggestions: some View {
        if !userStore.profile.followedKeywords.isEmpty {
            Text("フォロー中のキーワード")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.textSecondary)
                .padding(.horizontal, 20)
                .padding(.top, 16)
            FlowChips(items: userStore.profile.followedKeywords) { keyword in
                query = keyword
            }
            .padding(.horizontal, 20)
            .padding(.top, 10)
        } else {
            VStack(spacing: 10) {
                Image(systemName: "text.magnifyingglass")
                    .font(.largeTitle)
                    .foregroundStyle(Theme.textSecondary)
                Text("気になる話題を検索してみましょう")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 80)
        }
    }

    @ViewBuilder
    private var results: some View {
        if !localResults.isEmpty {
            sectionHeader("読み込み済みのニュース")
            ForEach(localResults) { article in
                row(article)
            }
        }
        if isSearching {
            HStack(spacing: 8) {
                ProgressView()
                Text("Webから検索中…")
                    .font(.footnote)
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(20)
        }
        if !remoteResults.isEmpty {
            sectionHeader("Webのニュース（GNews）")
            ForEach(remoteResults) { article in
                row(article)
            }
        }
        if localResults.isEmpty, remoteResults.isEmpty, !isSearching {
            VStack(spacing: 8) {
                Text("「\(trimmedQuery)」に一致する記事が見つかりません")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
                if userStore.profile.gnewsAPIKey.isEmpty {
                    Text("設定でGNews APIキーを登録すると、Web全体からも検索できます")
                        .font(.caption)
                        .foregroundStyle(Theme.textSecondary.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 60)
            .padding(.horizontal, 32)
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Theme.textSecondary)
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 2)
    }

    @ViewBuilder
    private func row(_ article: Article) -> some View {
        ArticleRowView(article: article, isRead: userStore.isRead(article)) {
            openedArticle = article
            userStore.markRead(article)
        }
        Divider()
            .overlay(Theme.divider)
            .padding(.leading, 20)
    }
}

struct FlowChips: View {
    let items: [String]
    let onTap: (String) -> Void

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.adaptive(minimum: 90), spacing: 8)],
            alignment: .leading,
            spacing: 8
        ) {
            ForEach(items, id: \.self) { item in
                Button {
                    onTap(item)
                } label: {
                    Text(item)
                        .font(.footnote.weight(.medium))
                        .lineLimit(1)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .frame(maxWidth: .infinity)
                        .background(Capsule().fill(Theme.surface))
                        .overlay(Capsule().stroke(Theme.divider, lineWidth: 1))
                        .foregroundStyle(Theme.textPrimary)
                }
                .buttonStyle(.plain)
            }
        }
    }
}
