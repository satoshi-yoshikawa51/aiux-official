import SwiftUI
import SafariServices

// MARK: - サムネイル

struct ArticleThumbnail: View {
    let article: Article
    @State private var resolvedURL: URL?

    var body: some View {
        ZStack {
            if let url = article.imageURL ?? resolvedURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .task(id: article.id) {
            if article.imageURL == nil, resolvedURL == nil {
                resolvedURL = await OGImageLoader.shared.imageURL(for: article.link)
            }
        }
    }

    private var placeholder: some View {
        ZStack {
            Theme.surfaceHighlight
            Image(systemName: article.category.icon)
                .font(.title3)
                .foregroundStyle(Theme.textSecondary.opacity(0.6))
        }
    }
}

// MARK: - 記事リスト行

struct ArticleRowView: View {
    @EnvironmentObject private var userStore: UserStore
    let article: Article
    let isRead: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 7) {
                    Text(article.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isRead ? Theme.textSecondary : Theme.textPrimary)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)
                    HStack(spacing: 6) {
                        Text(article.category.displayName)
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(Theme.accent)
                        Text(article.sourceName)
                            .font(.caption2)
                            .foregroundStyle(Theme.textSecondary)
                        if let date = article.publishedAt {
                            Text(date.relativeText)
                                .font(.caption2)
                                .foregroundStyle(Theme.textSecondary)
                        }
                        if userStore.isBookmarked(article) {
                            Image(systemName: "bookmark.fill")
                                .font(.caption2)
                                .foregroundStyle(Theme.accent)
                        }
                    }
                }
                Spacer(minLength: 0)
                ArticleThumbnail(article: article)
                    .frame(width: 96, height: 68)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - ヒーローカード（おすすめ先頭）

struct HeroCardView: View {
    let article: Article
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottomLeading) {
                ArticleThumbnail(article: article)
                    .frame(maxWidth: .infinity)
                    .frame(height: 210)
                    .clipped()
                LinearGradient(
                    colors: [.clear, .black.opacity(0.35), .black.opacity(0.88)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 5) {
                        Image(systemName: "wand.and.stars")
                        Text("あなたへのおすすめ")
                    }
                    .font(.caption2.weight(.bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Theme.accentGradient))
                    .foregroundStyle(.black)

                    Text(article.title)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)

                    HStack(spacing: 6) {
                        Text(article.category.displayName)
                            .foregroundStyle(Theme.accent)
                        Text(article.sourceName)
                        if let date = article.publishedAt {
                            Text(date.relativeText)
                        }
                    }
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
                }
                .padding(16)
            }
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Theme.divider, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - アプリ内ブラウザ

struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: url)
        controller.preferredBarTintColor = UIColor(Theme.background)
        controller.preferredControlTintColor = UIColor(Theme.accent)
        return controller
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
