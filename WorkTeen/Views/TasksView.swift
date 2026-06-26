//
//  TasksView.swift
//  WorkTeen
//
//  Read-only list of approved gigs, plus a map view toggle.
//  Contact info is gated behind "reveal" in both list and map modes.
//  Gig pins on the map are always plotted at an approximate location.
//

import SwiftUI

enum TasksViewMode { case list, map }

struct TasksView: View {
    @ObservedObject var service: FirestoreService

    @State private var gigs: [PostedGig] = []
    @State private var revealedContacts: Set<String> = []
    @State private var reportedIds: Set<String> = []
    @State private var confirmReportId: String? = nil
    @State private var viewMode: TasksViewMode = .list

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let coral   = Color(hex: "#E8724A")

    private var mappableGigs: [PostedGig] {
        gigs.filter { !$0.address.isEmpty }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // List/Map toggle (only shown when there are gigs)
                if !gigs.isEmpty {
                    ViewModeToggle(
                        mode: Binding(
                            get: { viewMode == .list ? .list : .map },
                            set: { viewMode = $0 == .list ? .list : .map }
                        ),
                        gold: gold, surface: surface, border: border, textSec: textSec
                    )
                    .padding(.horizontal)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                    Divider().background(border)
                }

                if viewMode == .map && !gigs.isEmpty {
                    JobsMapView(
                        jobs: [],
                        gigs: mappableGigs,
                        teen: Teen(id: UUID(), name: "", age: 0, state: "", zip: "", bio: "", availability: []),
                        service: service,
                        revealedContacts: $revealedContacts,
                        reportedIds: $reportedIds
                    )
                    .ignoresSafeArea(edges: .bottom)
                } else {
                    listContent
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

    @ViewBuilder
    private var listContent: some View {
        if gigs.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "tray")
                    .font(.largeTitle).foregroundColor(textSec)
                Text("No gigs posted yet.")
                    .font(.subheadline).foregroundColor(textSec)
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
                .padding(.bottom, 100)
            }
        }
    }
}

// MARK: - Gig Card

struct GigCard: View {
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
                        .font(.caption).foregroundColor(textSec)
                }
                Spacer()
                Button(action: onReport) {
                    Image(systemName: isReported ? "flag.fill" : "flag")
                        .font(.caption)
                        .foregroundColor(isReported ? coral : textSec)
                }
                .buttonStyle(.plain)
                .disabled(isReported)
            }

            HStack(spacing: 4) {
                Text("Pay:").font(.caption).foregroundColor(textSec)
                Text("\(gig.payAmount) / \(gig.payType)")
                    .font(.caption).fontWeight(.bold).foregroundColor(gold)
            }

            Text(gig.description)
                .font(.caption).foregroundColor(textSec).lineLimit(3)

            if isRevealed {
                HStack(spacing: 6) {
                    Image(systemName: "phone.fill").font(.caption).foregroundColor(gold)
                    Text(gig.posterPhone)
                        .font(.subheadline).fontWeight(.semibold).foregroundColor(textPri)
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
                    .font(.caption2).foregroundColor(coral)
            }
        }
        .padding(14)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}
