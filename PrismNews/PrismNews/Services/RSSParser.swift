import Foundation

/// Yahoo!ニュース トピックスRSS（RSS 2.0）のパーサー
final class RSSParser: NSObject, XMLParserDelegate {
    private var articles: [Article] = []
    private var category: NewsCategory = .top
    private var currentElement = ""
    private var inItem = false
    private var title = ""
    private var link = ""
    private var pubDate = ""
    private var summary = ""

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss Z"
        return formatter
    }()

    func parse(data: Data, category: NewsCategory) -> [Article] {
        self.category = category
        articles = []
        let parser = XMLParser(data: data)
        parser.delegate = self
        parser.parse()
        return articles
    }

    func parser(
        _ parser: XMLParser,
        didStartElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?,
        attributes attributeDict: [String: String] = [:]
    ) {
        currentElement = elementName
        if elementName == "item" {
            inItem = true
            title = ""
            link = ""
            pubDate = ""
            summary = ""
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        guard inItem else { return }
        switch currentElement {
        case "title": title += string
        case "link": link += string
        case "pubDate": pubDate += string
        case "description": summary += string
        default: break
        }
    }

    func parser(
        _ parser: XMLParser,
        didEndElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?
    ) {
        if elementName == "item" {
            inItem = false
            let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedLink = link.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedSummary = summary.trimmingCharacters(in: .whitespacesAndNewlines)
            if let url = URL(string: trimmedLink), !trimmedTitle.isEmpty {
                articles.append(
                    Article(
                        title: trimmedTitle,
                        link: url,
                        publishedAt: Self.dateFormatter.date(
                            from: pubDate.trimmingCharacters(in: .whitespacesAndNewlines)
                        ),
                        category: category,
                        sourceName: "Yahoo!ニュース",
                        summary: trimmedSummary.isEmpty ? nil : trimmedSummary,
                        imageURL: nil
                    )
                )
            }
        }
        currentElement = ""
    }
}
