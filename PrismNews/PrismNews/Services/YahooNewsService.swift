import Foundation

/// Yahoo!ニュース公式RSS（APIキー不要）から記事を取得する
struct YahooNewsService: Sendable {
    func fetch(category: NewsCategory) async throws -> [Article] {
        var request = URLRequest(url: category.rssURL)
        request.timeoutInterval = 15
        let (data, _) = try await URLSession.shared.data(for: request)
        return RSSParser().parse(data: data, category: category)
    }
}
