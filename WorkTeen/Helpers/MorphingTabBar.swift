//
//  MorphingTabBar.swift
//  WorkTeen
//

import SwiftUI
import UIKit

// MARK: - Protocol

protocol MorphingTabProtocol: CaseIterable, Hashable {
    var symbolImage: String { get }
}

// MARK: - App Tabs

enum AppTab: String, MorphingTabProtocol, CaseIterable {
    case home         = "Home"
    case jobs         = "Jobs"
    case tasks        = "Tasks"
    case applications = "Applications"
    case profile      = "Profile"

    var symbolImage: String {
        switch self {
        case .home:         return "house.fill"
        case .jobs:         return "briefcase.fill"
        case .tasks:        return "list.bullet"
        case .applications: return "doc.text.fill"
        case .profile:      return "person.circle"
        }
    }
}

// MARK: - MorphingTabBar

struct MorphingTabBar<Tab: MorphingTabProtocol, ExpandedContent: View>: View {
    @Binding var activeTab: Tab
    @Binding var isExpanded: Bool
    @ViewBuilder var expandedContent: ExpandedContent
    @State private var viewWidth: CGFloat?

    var body: some View {
        ZStack {
            Spacer()
            let symbols = Array(Tab.allCases).compactMap { $0.symbolImage }
            let selectedIndex = Binding {
                symbols.firstIndex(of: activeTab.symbolImage) ?? 0
            } set: { index in
                activeTab = Array(Tab.allCases)[index]
            }

            if let viewWidth {
                let progress: CGFloat = isExpanded ? 1 : 0
                let labelSize = CGSize(width: viewWidth, height: 52)
                let cornerRadius = labelSize.height / 2

                ZStack {
                    GlassEffectPlaceholder(
                        alignment: .center,
                        progress: progress,
                        labelSize: labelSize,
                        cornerRadius: cornerRadius
                    )

                    CustomTabBar(symbols: symbols, index: selectedIndex) { image in
                        let font = UIFont.systemFont(ofSize: 21)
                        let config = UIImage.SymbolConfiguration(font: font)
                        return UIImage(systemName: image, withConfiguration: config)
                    }
                }
                .frame(width: labelSize.width, height: labelSize.height)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(Color.white.opacity(0.35), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.03), radius: 14, x: 0, y: 10)
                .shadow(color: Color.black.opacity(0.06), radius: 2, x: 0, y: 1)
            }
        }
        .frame(height: 64)
        .frame(maxWidth: .infinity)
        .onGeometryChange(for: CGFloat.self) {
            $0.size.width
        } action: { newValue in
            viewWidth = newValue
        }
        .frame(height: viewWidth == nil ? 52 : nil)
    }
}

// MARK: - CustomTabBar (UISegmentedControl wrapper)

private struct CustomTabBar: UIViewRepresentable {
    var symbols: [String]
    @Binding var index: Int
    var image: (String) -> UIImage?

    // Gold accent: #F5A623
    private let goldColor = UIColor(red: 0.961, green: 0.651, blue: 0.137, alpha: 1)

    func makeUIView(context: Context) -> UISegmentedControl {
        let items: [Any] = symbols.compactMap { image($0) ?? UIImage(systemName: $0) }
        let control = UISegmentedControl(items: items)
        control.selectedSegmentIndex = index
        control.backgroundColor = .clear
        // Gold pill behind the selected segment
        control.selectedSegmentTintColor = goldColor.withAlphaComponent(0.18)
        control.setTitleTextAttributes(
            [.font: UIFont.systemFont(ofSize: 18, weight: .medium)],
            for: .normal
        )
        control.heightAnchor.constraint(greaterThanOrEqualToConstant: 56).isActive = true
        control.addTarget(
            context.coordinator,
            action: #selector(Coordinator.valueChanged(_:)),
            for: .valueChanged
        )
        applyIconTint(control)
        return control
    }

    func updateUIView(_ uiView: UISegmentedControl, context: Context) {
        if uiView.selectedSegmentIndex != index {
            uiView.selectedSegmentIndex = index
        }
        applyIconTint(uiView)
    }

    private func applyIconTint(_ control: UISegmentedControl) {
        for i in symbols.indices {
            let color = i == index ? goldColor : UIColor(white: 0.6, alpha: 1)
            let base = image(symbols[i]) ?? UIImage(systemName: symbols[i]) ?? UIImage()
            control.setImage(
                base.withTintColor(color, renderingMode: .alwaysOriginal),
                forSegmentAt: i
            )
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    class Coordinator: NSObject {
        var parent: CustomTabBar
        init(parent: CustomTabBar) { self.parent = parent }
        @objc func valueChanged(_ sender: UISegmentedControl) {
            parent.index = sender.selectedSegmentIndex
        }
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UISegmentedControl, context: Context) -> CGSize? {
        proposal.replacingUnspecifiedDimensions()
    }
}

// MARK: - Glass Background

private struct GlassEffectPlaceholder: View {
    var alignment: Alignment
    var progress: CGFloat
    var labelSize: CGSize
    var cornerRadius: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: max(8, cornerRadius), style: .continuous)
            .fill(.ultraThinMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: max(8, cornerRadius), style: .continuous)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
            .opacity(Double(max(min(progress, 1), 0.35)))
            .frame(
                width: max(labelSize.width, 0),
                height: max(labelSize.height, 0),
                alignment: alignment
            )
            .allowsHitTesting(false)
    }
}

// MARK: - Color Hex Helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:  (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:  (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
