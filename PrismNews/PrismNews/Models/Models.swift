import Foundation

enum NewsCategory: String, CaseIterable, Codable, Identifiable, Sendable {
    case top
    case domestic
    case world
    case business
    case entertainment
    case sports
    case it
    case science
    case local

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .top: return "主要"
        case .domestic: return "国内"
        case .world: return "国際"
        case .business: return "経済"
        case .entertainment: return "エンタメ"
        case .sports: return "スポーツ"
        case .it: return "IT"
        case .science: return "科学"
        case .local: return "地域"
        }
    }

    var icon: String {
        switch self {
        case .top: return "flame"
        case .domestic: return "building.2"
        case .world: return "globe.asia.australia"
        case .business: return "chart.line.uptrend.xyaxis"
        case .entertainment: return "sparkles.tv"
        case .sports: return "figure.run"
        case .it: return "cpu"
        case .science: return "atom"
        case .local: return "map"
        }
    }

    var rssURL: URL {
        let feedName = self == .top ? "top-picks" : rawValue
        return URL(string: "https://news.yahoo.co.jp/rss/topics/\(feedName).xml")!
    }
}

struct Article: Identifiable, Codable, Equatable, Hashable, Sendable {
    let title: String
    let link: URL
    let publishedAt: Date?
    let category: NewsCategory
    let sourceName: String
    var summary: String?
    var imageURL: URL?

    var id: String { link.absoluteString }
}
