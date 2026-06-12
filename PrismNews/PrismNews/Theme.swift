import SwiftUI

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

enum Theme {
    static let background = Color(hex: 0x0A0D12)
    static let surface = Color(hex: 0x141A22)
    static let surfaceHighlight = Color(hex: 0x1C2430)
    static let accent = Color(hex: 0x4FD8C8)
    static let accentSecondary = Color(hex: 0x3B82F6)
    static let textPrimary = Color(hex: 0xF2F5F8)
    static let textSecondary = Color(hex: 0x8B97A6)
    static let divider = Color.white.opacity(0.06)

    static var accentGradient: LinearGradient {
        LinearGradient(
            colors: [accent, accentSecondary],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

extension Date {
    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.unitsStyle = .abbreviated
        return formatter
    }()

    var relativeText: String {
        Self.relativeFormatter.localizedString(for: self, relativeTo: Date())
    }
}
