import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var userStore: UserStore
    @State private var selected: Set<NewsCategory> = [.top]
    @State private var keywordInput = ""
    @State private var keywords: [String] = []

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    hero
                    categoryPicker
                    keywordEditor
                    startButton
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 10) {
            (Text("Prism").foregroundColor(Theme.textPrimary)
                + Text(".").foregroundColor(Theme.accent))
                .font(.system(size: 42, weight: .heavy, design: .rounded))
            Text("あなたの興味に合わせて、毎日のニュースを自動で厳選します。読むほどに、おすすめが賢くなります。")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(3)
        }
        .padding(.top, 40)
    }

    private var categoryPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("気になるジャンルを選んでください")
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)
            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 104), spacing: 10)],
                spacing: 10
            ) {
                ForEach(NewsCategory.allCases) { category in
                    categoryChip(category)
                }
            }
        }
    }

    private func categoryChip(_ category: NewsCategory) -> some View {
        let isOn = selected.contains(category)
        return Button {
            if isOn {
                selected.remove(category)
            } else {
                selected.insert(category)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: category.icon).font(.caption)
                Text(category.displayName).font(.footnote.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background {
                if isOn {
                    RoundedRectangle(cornerRadius: 11, style: .continuous)
                        .fill(Theme.accentGradient)
                } else {
                    RoundedRectangle(cornerRadius: 11, style: .continuous)
                        .fill(Theme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 11, style: .continuous)
                                .stroke(Theme.divider, lineWidth: 1)
                        )
                }
            }
            .foregroundStyle(isOn ? Color.black : Theme.textSecondary)
        }
        .buttonStyle(.plain)
    }

    private var keywordEditor: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("フォローするキーワード（任意）")
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)
            HStack(spacing: 10) {
                TextField("例：生成AI、大谷翔平、半導体", text: $keywordInput)
                    .foregroundStyle(Theme.textPrimary)
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(Theme.surface)
                    )
                    .submitLabel(.done)
                    .onSubmit(addKeyword)
                Button(action: addKeyword) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(Theme.accent)
                }
                .disabled(
                    keywordInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                )
            }
            if !keywords.isEmpty {
                FlowChips(items: keywords) { keyword in
                    keywords.removeAll { $0 == keyword }
                }
                Text("タップで削除")
                    .font(.caption2)
                    .foregroundStyle(Theme.textSecondary)
            }
        }
    }

    private var startButton: some View {
        Button {
            userStore.completeOnboarding(interests: selected, keywords: keywords)
        } label: {
            Text("はじめる")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Theme.accentGradient)
                )
                .foregroundStyle(.black)
        }
        .disabled(selected.isEmpty)
        .opacity(selected.isEmpty ? 0.4 : 1)
        .padding(.top, 8)
    }

    private func addKeyword() {
        let trimmed = keywordInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if !keywords.contains(trimmed) {
            keywords.append(trimmed)
        }
        keywordInput = ""
    }
}
