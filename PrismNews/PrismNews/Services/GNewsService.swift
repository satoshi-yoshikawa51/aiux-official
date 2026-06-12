import Foundation

/// GNews API（https://gnews.io）クライアント。
/// 検索タブでWeb全体のニュースを横断検索するためのオプション機能。
/// 無料プランのAPIキーを設定画面から登録すると有効になる。
struct GNewsService: Sendable {
    let apiKey: String

    func search(query: String) async throws -> [Article] {
        var components = URLComponents(string: "https://gnews.io/api/v4/search")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "lang", value: "ja"),
            URLQueryItem(name: "country", value: "jp"),
            URLQueryItem(name: "max", value: "20"),
            URLQueryItem(name: "apikey", value: apiKey),
        ]
        guard let url = components.url else { return [] }
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(Response.self, from: data)
        let isoFormatter = ISO8601DateFormatter()
        return response.articles.compactMap { item -> Article? in
            guard let link = URL(string: item.url) else { return nil }
            return Article(
                title: item.title,
                link: link,
                publishedAt: item.publishedAt.flatMap { isoFormatter.date(from: $0) },
                category: .top,
                sourceName: item.source?.name ?? "GNews",
                summary: item.description,
                imageURL: item.image.flatMap { URL(string: $0) }
            )
        }
    }

    private struct Response: Decodable {
        let articles: [Item]
    }

    private struct Item: Decodable {
        let title: String
        let description: String?
        let url: String
        let image: String?
        let publishedAt: String?
        let source: Source?

        struct Source: Decodable {
            let name: String?
        }
    }
}
