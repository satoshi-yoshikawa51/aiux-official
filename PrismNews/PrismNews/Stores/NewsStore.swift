import Foundation

@MainActor
final class NewsStore: ObservableObject {
    @Published private(set) var articlesByCategory: [NewsCategory: [Article]] = [:]
    @Published private(set) var isLoading = false
    @Published private(set) var lastUpdated: Date?

    private let service = YahooNewsService()

    /// 全カテゴリのRSSを並列で取得する
    func refreshAll() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let service = self.service
        var results: [NewsCategory: [Article]] = [:]
        await withTaskGroup(of: (NewsCategory, [Article]).self) { group in
            for category in NewsCategory.allCases {
                group.addTask {
                    let articles = (try? await service.fetch(category: category)) ?? []
                    return (category, articles)
                }
            }
            for await (category, articles) in group where !articles.isEmpty {
                results[category] = articles
            }
        }

        for (category, articles) in results {
            articlesByCategory[category] = articles
        }
        if !results.isEmpty {
            lastUpdated = Date()
        }
    }

    /// 全カテゴリの記事をリンクで重複排除してまとめる
    var allArticles: [Article] {
        var seen = Set<String>()
        var merged: [Article] = []
        for category in NewsCategory.allCases {
            for article in articlesByCategory[category] ?? [] where seen.insert(article.id).inserted {
                merged.append(article)
            }
        }
        return merged
    }

    /// ユーザーの好みスコアで並べ替えた「おすすめ」フィード
    func recommended(using user: UserStore) -> [Article] {
        let scored = allArticles
            .filter { !user.isHidden($0) }
            .map { ($0, user.score(for: $0)) }
        return scored
            .sorted { $0.1 > $1.1 }
            .map { $0.0 }
    }
}
