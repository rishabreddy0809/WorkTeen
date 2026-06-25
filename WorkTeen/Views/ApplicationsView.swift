//
//  ApplicationsView.swift
//  WorkTeen
//
//  Live list of the teen's submitted applications with color-coded status badges.
//

import SwiftUI

struct ApplicationsView: View {
    let teen: Teen
    @ObservedObject var service: FirestoreService

    @State private var applications: [Application] = []

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")
    private let coral   = Color(hex: "#E8724A")

    var body: some View {
        NavigationStack {
            Group {
                if applications.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundColor(textSec)
                        Text("No applications yet.")
                            .font(.subheadline)
                            .foregroundColor(textSec)
                        Text("Browse jobs and tap Apply to get started.")
                            .font(.caption)
                            .foregroundColor(textSec)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(applications.sorted { $0.appliedDate > $1.appliedDate }) { app in
                                ApplicationCard(
                                    application: app,
                                    surface: surface,
                                    border: border,
                                    textPri: textPri,
                                    textSec: textSec,
                                    gold: gold,
                                    sage: sage,
                                    coral: coral
                                )
                            }
                        }
                        .padding()
                        .padding(.bottom, 40)
                    }
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Applications")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .onAppear {
            service.listenToApplications(teenId: teen.id.uuidString) { self.applications = $0 }
        }
    }
}

// MARK: - Application Card

private struct ApplicationCard: View {
    let application: Application
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color
    let sage: Color
    let coral: Color

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                Text(application.jobTitle)
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundColor(textPri)
                Text(application.employerName)
                    .font(.caption)
                    .foregroundColor(textSec)
                Text("Applied \(application.appliedDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption2)
                    .foregroundColor(textSec)
            }
            Spacer()
            StatusBadge(status: application.status, gold: gold, sage: sage, coral: coral, textSec: textSec)
        }
        .padding(14)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}

// MARK: - Status Badge

private struct StatusBadge: View {
    let status: String
    let gold: Color
    let sage: Color
    let coral: Color
    let textSec: Color

    private var config: (label: String, color: Color) {
        switch status {
        case "applied":     return ("Applied", textSec)
        case "viewed":      return ("Viewed", gold)
        case "interview":   return ("Interview", gold)
        case "hired":       return ("Hired", sage)
        case "notSelected": return ("Not selected", coral)
        default:            return (status.capitalized, textSec)
        }
    }

    var body: some View {
        Text(config.label)
            .font(.caption2).fontWeight(.semibold)
            .foregroundColor(config.color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(config.color.opacity(0.15))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(config.color.opacity(0.4), lineWidth: 1))
            .cornerRadius(20)
    }
}
