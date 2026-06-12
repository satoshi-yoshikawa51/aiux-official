import Foundation
import NaturalLanguage

/// 記事タイトルをキーワードに分解する。
/// NLTokenizerは日本語の分かち書きに対応しているため、
/// 「いいね」した記事のタイトルから興味キーワードを抽出できる。
@MainActor
enum Tokenizer {
    private static var cache: [String: [String]] = [:]

    private static let stopWords: Set<String> = [
        "こと", "もの", "ため", "よう", "など", "これ", "それ", "あれ",
        "さん", "氏", "について", "から", "まで", "する", "した", "して",
        "です", "ます", "ない", "れる", "られる", "という", "ニュース",
    ]

    static func tokens(from text: String) -> [String] {
        if let cached = cache[text] { return cached }

        let tokenizer = NLTokenizer(unit: .word)
        tokenizer.string = text
        var result: [String] = []
        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { range, _ in
            let token = String(text[range])
            if token.count >= 2,
               token.rangeOfCharacter(from: .letters) != nil,
               !stopWords.contains(token) {
                result.append(token)
            }
            return true
        }

        if cache.count > 1000 { cache.removeAll() }
        cache[text] = result
        return result
    }
}
