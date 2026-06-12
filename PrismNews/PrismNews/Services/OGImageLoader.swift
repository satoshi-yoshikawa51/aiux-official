import Foundation

/// Yahoo!ニュースRSSにはサムネイルが含まれないため、
/// 記事ページのOGP（og:image）からサムネイルURLを遅延取得する。
actor OGImageLoader {
    static let shared = OGImageLoader()

    private var cache: [String: URL] = [:]
    private var failed: Set<String> = []
    private var inFlight: [String: Task<URL?, Never>] = [:]

    func imageURL(for pageURL: URL) async -> URL? {
        let key = pageURL.absoluteString
        if let hit = cache[key] { return hit }
        if failed.contains(key) { return nil }
        if let task = inFlight[key] { return await task.value }

        let task = Task<URL?, Never> { await Self.fetchOGImage(from: pageURL) }
        inFlight[key] = task
        let result = await task.value
        inFlight[key] = nil
        if let result {
            cache[key] = result
        } else {
            failed.insert(key)
        }
        return result
    }

    private static func fetchOGImage(from url: URL) async -> URL? {
        var request = URLRequest(url: url)
        request.timeoutInterval = 10
        guard let (data, _) = try? await URLSession.shared.data(for: request) else { return nil }
        // og:imageはhead内にあるので先頭部分だけ見れば十分
        let html = String(prefix: 150_000, of: data)
        let patterns = [
            #"property="og:image"[^>]*content="([^"]+)""#,
            #"content="([^"]+)"[^>]*property="og:image""#,
        ]
        for pattern in patterns {
            guard let matchRange = html.range(of: pattern, options: .regularExpression) else { continue }
            let match = String(html[matchRange])
            guard let contentRange = match.range(of: #"content="[^"]+""#, options: .regularExpression) else { continue }
            var value = String(match[contentRange])
            value = value.replacingOccurrences(of: "content=\"", with: "")
            value = value.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            value = value.replacingOccurrences(of: "&amp;", with: "&")
            if let imageURL = URL(string: value), imageURL.scheme?.hasPrefix("http") == true {
                return imageURL
            }
        }
        return nil
    }
}

private extension String {
    /// UTF-8境界を壊さずにDataの先頭からデコードする
    init(prefix maxBytes: Int, of data: Data) {
        self = String(decoding: data.prefix(maxBytes), as: UTF8.self)
    }
}
