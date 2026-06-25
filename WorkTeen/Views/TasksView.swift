//
//  TasksView.swift
//  WorkTeen
//
//  Read-only list of approved gigs. Contact info is revealed on tap.
//  Report/flag button calls reportGig() — the status field is never written here.
//

import SwiftUI

struct TasksView: View {
    @ObservedObject var service: FirestoreService

    @State private var gigs: [PostedGig] = []
    @State private var revealedContacts: Set<String> = []
    @State private var reportedIds: Set<String> = []
    @State private var confirmReportId: String? = nil

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let coral   = Color(hex: "#E8724A")

    var body: some View {
        NavigationStack {
            Group {
                if gigs.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "tray")
                            .font(.largeTitle)
                            .foregroundColor(textSec)
                        Text("No gigs posted yet.")
                            .font(.subheadline)
                            .foregroundColor(textSec)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(gigs) { gig in
                                GigCard(
                                    gig: gig,
                                    isRevealed: revealedContacts.contains(gig.id),
                                    isReported: reportedIds.contains(gig.id) || gig.reported,
                                    surface: surface,
                                    border: border,
                                    textPri: textPri,
                                    textSec: textSec,
                                    gold: gold,
                                    coral: coral,
                                    onReveal: { revealedContacts.insert(gig.id) },
                                    onReport: { confirmReportId = gig.id }
                                )
                            }
                        }
                        .padding()
                        .padding(.bottom, 40)
                    }
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Tasks")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .onAppear {
            service.listenToApprovedGigs { self.gigs = $0.sorted { $0.datePosted > $1.datePosted } }
        }
        .confirmationDialog("Report this gig?", isPresented: Binding(
            get: { confirmReportId != nil },
            set: { if !$0 { confirmReportId = nil } }
        ), titleVisibility: .visible) {
            Button("Report", role: .destructive) {
                if let id = confirmReportId {
                    Task {
                        try? await service.reportGig(id: id)
                        reportedIds.insert(id)
                    }
                }
                confirmReportId = nil
            }
            Button("Cancel", role: .cancel) { confirmReportId = nil }
        } message: {
            Text("This gig will be flagged for review. The poster's info will remain visible to you until it's removed.")
        }
    }
}

// MARK: - Gig Card

private struct GigCard: View {
    let gig: PostedGig
    let isRevealed: Bool
    let isReported: Bool
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color
    let coral: Color
    let onReveal: () -> Void
    let onReport: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(gig.title)
                        .font(.subheadline).fontWeight(.semibold)
                        .foregroundColor(textPri)
                    Text("\(gig.category) · \(gig.zip)")
                        .font(.caption)
                        .foregroundColor(textSec)
                }
                Spacer()
                // Flag / report button
                Button(action: onReport) {
                    Image(systemName: isReported ? "flag.fill" : "flag")
                        .font(.caption)
                        .foregroundColor(isReported ? coral : textSec)
                }
                .buttonStyle(.plain)
                .disabled(isReported)
            }

            // Pay
            HStack(spacing: 4) {
                Text("Pay:")
                    .font(.caption)
                    .foregroundColor(textSec)
                Text("\(gig.payAmount) / \(gig.payType)")
                    .font(.caption).fontWeight(.bold)
                    .foregroundColor(gold)
            }

            // Description
            Text(gig.description)
                .font(.caption)
                .foregroundColor(textSec)
                .lineLimit(3)

            // Contact reveal
            if isRevealed {
                HStack(spacing: 6) {
                    Image(systemName: "phone.fill")
                        .font(.caption)
                        .foregroundColor(gold)
                    Text(gig.posterPhone)
                        .font(.subheadline).fontWeight(.semibold)
                        .foregroundColor(textPri)
                }
                .padding(10)
                .background(Color(hex: "#0F0F13"))
                .cornerRadius(8)
            } else {
                Button(action: onReveal) {
                    HStack(spacing: 6) {
                        Image(systemName: "eye")
                        Text("Reveal contact info")
                    }
                    .font(.caption).fontWeight(.semibold)
                    .foregroundColor(gold)
                    .padding(10)
                    .background(gold.opacity(0.12))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }

            if isReported {
                Text("Reported — under review")
                    .font(.caption2)
                    .foregroundColor(coral)
            }
        }
        .padding(14)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}
