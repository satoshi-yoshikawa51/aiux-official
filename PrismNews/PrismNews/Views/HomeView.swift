import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var newsStore: NewsStore
    @EnvironmentObject private var userStore: UserStore
    @State private var selection: Selection = .forYou
    @State private var openedArticle: Article?

    enum Selection: Hashable {
        case forYou
        case category(NewsCategory)
    }

    private var articles: [Article] {
        switch selection {
        case .forYou:
            return Array(newsStore.recommended(using: userStore).prefix(80))
        case .category(let category):
            return (newsStore.articlesByCategory[category] ?? [])
                .filter { !userStore.isHidden($0) }
        }
    }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                categoryBar
                articleList
            }
        }
        .sheet(item: $openedArticle) { article in
            SafariView(url: article.link)
                .ignoresSafeArea()
        }
    }

    // MARK: - ヘッダー

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            (Text("Prism").foregroundColor(Theme.textPrimary)
                + Text(".").foregroundColor(Theme.accent))
                .font(.system(size: 26, weight: .heavy, design: .rounded))
            Spacer()
            Text(
                Date.now.formatted(
                    .dateTime.locale(Locale(identifier: "ja_JP")).month().day().weekday()
                )
            )
            .font(.footnote)
            .foregroundStyle(Theme.textSecondary)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 2)
    }

    // MARK: - カテゴリ切り替え

    private var categoryBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(
                    title: "おすすめ",
                    icon: "wand.and.stars",
                    isSelected: selection == .forYou
                ) { selection = .forYou }
                ForEach(NewsCategory.allCases) { category in
                    chip(
                        title: category.displayName,
                        icon: category.icon,
                        isSelected: selection == .category(category)
                    ) { selection = .category(category) }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
        }
    }

    private func chip(
        title: String,
        icon: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.caption2)
                Text(title).font(.footnote.weight(.semibold))
            }
            .padding(.horizontal, 13)
            .padding(.vertical, 8)
            .background {
                if isSelected {
                    Capsule().fill(Theme.accentGradient)
                } else {
                    Capsule().fill(Theme.surface)
                        .overlay(Capsule().stroke(Theme.divider, lineWidth: 1))
                }
            }
            .foregroundStyle(isSelected ? Color.black : Theme.textSecondary)
        }
        .buttonStyle(.plain)
    }

    // MARK: - 記事リスト

    private var articleList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                if newsStore.isLoading && articles.isEmpty {
                    loadingPlaceholder
                } else if articles.isEmpty {
                    emptyState
                } else {
                    content
                }
            }
            .padding(.bottom, 24)
        }
        .refreshable { await newsStore.refreshAll() }
    }

    @ViewBuilder
    private var content: some View {
        let list = articles
        if case .forYou = selection, let first = list.first {
            HeroCardView(article: first) { open(first) }
                .padding(.horizontal, 20)
                .padding(.top, 6)
                .padding(.bottom, 4)
                .contextMenu { contextMenu(for: first) }
            rows(Array(list.dropFirst()))
        } else {
            rows(list)
        }
    }

    private func rows(_ list: [Article]) -> some View {
        ForEach(list) { article in
            ArticleRowView(article: article, isRead: userStore.isRead(article)) {
                open(article)
            }
            .contextMenu { contextMenu(for: article) }
            Divider()
                .overlay(Theme.divider)
                .padding(.leading, 20)
        }
    }

    @ViewBuilder
    private func contextMenu(for article: Article) -> some View {
        Button {
            userStore.like(article)
        } label: {
            Label("いいね（似た記事を増やす）", systemImage: "hand.thumbsup")
        }
        Button {
            userStore.toggleBookmark(article)
        } label: {
            Label(
                userStore.isBookmarked(article) ? "あとで読むから削除" : "あとで読む",
                systemImage: "bookmark"
            )
        }
        ShareLink(item: article.link) {
            Label("共有", systemImage: "square.and.arrow.up")
        }
        Button(role: .destructive) {
            userStore.hide(article)
        } label: {
            Label("興味なし（似た記事を減らす）", systemImage: "hand.thumbsdown")
        }
    }

    private func open(_ article: Article) {
        openedArticle = article
        userStore.markRead(article)
    }

    // MARK: - プレースホルダ

    private var loadingPlaceholder: some View {
        ForEach(0..<8, id: \.self) { _ in
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    RoundedRectangle(cornerRadius: 4).fill(Theme.surface)
                        .frame(height: 14)
                    RoundedRectangle(cornerRadius: 4).fill(Theme.surface)
                        .frame(width: 180, height: 14)
                    RoundedRectangle(cornerRadius: 4).fill(Theme.surface)
                        .frame(width: 90, height: 10)
                }
                Spacer()
                RoundedRectangle(cornerRadius: 10).fill(Theme.surface)
                    .frame(width: 96, height: 68)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 13)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.exclamationmark")
                .font(.largeTitle)
                .foregroundStyle(Theme.textSecondary)
            Text("記事を取得できませんでした")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
            Button("再読み込み") {
                Task { await newsStore.refreshAll() }
            }
            .font(.footnote.weight(.semibold))
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 90)
    }
}
