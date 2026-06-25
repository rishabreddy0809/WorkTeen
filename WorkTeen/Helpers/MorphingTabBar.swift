//
//  MorphingTabBar.swift
//  WorkTeen
//
//  Custom bottom tab bar that uses solid-color active state with gold accent.
//  No plus/add button.
//

import SwiftUI
import UIKit

// MARK: - Protocol

protocol MorphingTabProtocol: Hashable {
    var rawValue: String { get }
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

struct MorphingTabBar: View {
    @Binding var activeTab: AppTab

    // Design system colors
    private let surface   = Color(hex: "#1A1A24")
    private let border    = Color(hex: "#2A2A38")
    private let textSec   = Color(hex: "#9B9AAF")
    private let gold      = Color(hex: "#F5A623")

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                Button {
                    activeTab = tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.symbolImage)
                            .font(.system(size: 20, weight: .medium))
                            .foregroundColor(activeTab == tab ? gold : textSec)
                        Text(tab.rawValue)
                            .font(.system(size: 10, weight: activeTab == tab ? .semibold : .regular))
                            .foregroundColor(activeTab == tab ? gold : textSec)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
                .buttonStyle(.plain)
            }
        }
        .background(
            surface
                .overlay(
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(border),
                    alignment: .top
                )
        )
        .ignoresSafeArea(edges: .bottom)
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
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
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
