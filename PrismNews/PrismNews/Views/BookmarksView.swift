import SwiftUI

struct BookmarksView: View {
    @EnvironmentObject private var userStore: UserStore
    @State private var openedArticle: Article?

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Text("あとで読む")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Text("\(userStore.profile.bookmarks.count)件")
                        .font(.footnote)
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)

                if userStore.profile.bookmarks.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
        }
        .sheet(item: $openedArticle) { article in
            SafariView(url: article.link).ignoresSafeArea()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "bookmark")
                .font(.largeTitle)
                .foregroundStyle(Theme.textSecondary)
            Text("記事を長押しして「あとで読む」に保存できます")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 32)
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(userStore.profile.bookmarks) { article in
                    ArticleRowView(article: article, isRead: userStore.isRead(article)) {
                        openedArticle = article
                        userStore.markRead(article)
                    }
                    .contextMenu {
                        Button(role: .destructive) {
                            userStore.toggleBookmark(article)
                        } label: {
                            Label("リストから削除", systemImage: "bookmark.slash")
                        }
                        ShareLink(item: article.link) {
                            Label("共有", systemImage: "square.and.arrow.up")
                        }
                    }
                    Divider()
                        .overlay(Theme.divider)
                        .padding(.leading, 20)
                }
            }
            .padding(.bottom, 24)
        }
    }
}
