import Foundation

struct UserProfile: Codable {
    var hasOnboarded = false
    var interests: Set<NewsCategory> = []
    var followedKeywords: [String] = []
    var categoryWeights: [String: Double] = [:]
    var keywordWeights: [String: Double] = [:]
    var readIDs: [String] = []
    var likedIDs: [String] = []
    var hiddenIDs: [String] = []
    var bookmarks: [Article] = []
    var gnewsAPIKey = ""
}

/// ユーザーの好みを保存・学習するストア。
/// 「いいね」「興味なし」「閲覧」の3シグナルから、
/// カテゴリとキーワードの重みを更新して記事スコアに反映する。
@MainActor
final class UserStore: ObservableObject {
    @Published private(set) var profile: UserProfile

    private static var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("profile.json")
    }

    init() {
        if let data = try? Data(contentsOf: Self.fileURL),
           let saved = try? JSONDecoder().decode(UserProfile.self, from: data) {
            profile = saved
        } else {
            profile = UserProfile()
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(profile) {
            try? data.write(to: Self.fileURL, options: .atomic)
        }
    }

    private func update(_ mutate: (inout UserProfile) -> Void) {
        var updated = profile
        mutate(&updated)
        profile = updated
        save()
    }

    // MARK: - オンボーディング・設定

    func completeOnboarding(interests: Set<NewsCategory>, keywords: [String]) {
        update { p in
            p.hasOnboarded = true
            p.interests = interests
            p.followedKeywords = keywords
        }
    }

    func setInterests(_ interests: Set<NewsCategory>) {
        update { p in p.interests = interests }
    }

    func addKeyword(_ keyword: String) {
        let trimmed = keyword.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        update { p in
            if !p.followedKeywords.contains(trimmed) {
                p.followedKeywords.append(trimmed)
            }
        }
    }

    func removeKeyword(_ keyword: String) {
        update { p in p.followedKeywords.removeAll { $0 == keyword } }
    }

    func setGNewsAPIKey(_ key: String) {
        update { p in p.gnewsAPIKey = key.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    func resetLearningData() {
        update { p in
            p.categoryWeights = [:]
            p.keywordWeights = [:]
            p.readIDs = []
            p.likedIDs = []
            p.hiddenIDs = []
        }
    }

    // MARK: - 行動シグナル

    func markRead(_ article: Article) {
        guard !profile.readIDs.contains(article.id) else { return }
        update { p in
            p.readIDs.append(article.id)
            if p.readIDs.count > 500 {
                p.readIDs.removeFirst(p.readIDs.count - 500)
            }
        }
        learn(from: article, weight: 0.3)
    }

    func like(_ article: Article) {
        guard !profile.likedIDs.contains(article.id) else { return }
        update { p in p.likedIDs.append(article.id) }
        learn(from: article, weight: 1.0)
    }

    func hide(_ article: Article) {
        guard !profile.hiddenIDs.contains(article.id) else { return }
        update { p in p.hiddenIDs.append(article.id) }
        learn(from: article, weight: -1.0)
    }

    func toggleBookmark(_ article: Article) {
        update { p in
            if let index = p.bookmarks.firstIndex(where: { $0.id == article.id }) {
                p.bookmarks.remove(at: index)
            } else {
                p.bookmarks.insert(article, at: 0)
            }
        }
    }

    func isBookmarked(_ article: Article) -> Bool {
        profile.bookmarks.contains { $0.id == article.id }
    }

    func isLiked(_ article: Article) -> Bool { profile.likedIDs.contains(article.id) }
    func isHidden(_ article: Article) -> Bool { profile.hiddenIDs.contains(article.id) }
    func isRead(_ article: Article) -> Bool { profile.readIDs.contains(article.id) }

    // MARK: - スコアリング

    /// 記事の「好みスコア」。おすすめフィードの並び順を決める。
    func score(for article: Article) -> Double {
        var score = profile.categoryWeights[article.category.rawValue] ?? 0

        if profile.interests.contains(article.category) {
            score += 1.5
        }

        for token in Tokenizer.tokens(from: article.title) {
            let weight = profile.keywordWeights[token] ?? 0
            score += min(max(weight, -3), 3) * 0.5
        }

        for keyword in profile.followedKeywords
        where article.title.localizedCaseInsensitiveContains(keyword) {
            score += 2.5
        }

        // 新しい記事ほど少し優遇（約24時間で減衰）
        if let published = article.publishedAt {
            let hours = max(0, -published.timeIntervalSinceNow / 3600)
            score += max(0, 1.5 - hours / 16)
        }

        // 既読は下げる
        if profile.readIDs.contains(article.id) {
            score -= 1.5
        }
        return score
    }

    private func learn(from article: Article, weight: Double) {
        update { p in
            let key = article.category.rawValue
            let current = p.categoryWeights[key] ?? 0
            p.categoryWeights[key] = min(max(current + 0.25 * weight, -2), 2)

            for token in Tokenizer.tokens(from: article.title) {
                let value = (p.keywordWeights[token] ?? 0) + 0.8 * weight
                p.keywordWeights[token] = min(max(value, -5), 5)
            }

            // 肥大化防止：影響の小さいキーワードから間引く
            if p.keywordWeights.count > 2000 {
                let sorted = p.keywordWeights.sorted { abs($0.value) < abs($1.value) }
                for (token, _) in sorted.prefix(p.keywordWeights.count - 2000) {
                    p.keywordWeights.removeValue(forKey: token)
                }
            }
        }
    }
}
