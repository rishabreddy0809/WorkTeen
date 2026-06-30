//
//  TasksView.swift
//  WorkTeen
//
//  Read-only list of approved gigs, plus a map view toggle.
//  Contact info is gated behind "reveal" in both list and map modes.
//  Gig pins on the map are always plotted at an approximate location.
//

import SwiftUI



struct TasksView: View {
    let teen: Teen
    @ObservedObject var service: FirestoreService

    @State private var gigs: [PostedGig] = []
    @State private var revealedContacts: Set<String> = []
    @State private var reportedIds: Set<String> = []
    @State private var confirmReportId: String? = nil
    @State private var viewMode: JobsViewMode = .list
    @State private var selectedGig: PostedGig? = nil

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let coral   = Color(hex: "#E8724A")

    // All gigs — geocoding falls back to zip when address is missing
    private var mappableGigs: [PostedGig] { gigs }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // List/Map toggle (only shown when there are gigs)
                if !gigs.isEmpty {
                    ViewModeToggle(
                        mode: $viewMode,
                        gold: gold, surface: surface, border: border, textSec: textSec
                    )
                    .padding(.horizontal)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                    Divider().background(border)
                }

                if viewMode == .map {
                    JobsMapView(
                        jobs: [],
                        gigs: mappableGigs,
                        teen: teen,
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
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .sheet(item: $selectedGig) { gig in
            GigDetailSheet(
                gig: gig,
                isReported: reportedIds.contains(gig.id) || gig.reported,
                service: service,
                onReport: { confirmReportId = gig.id }
            )
            .presentationDragIndicator(.visible)
            .presentationBackground(Color(hex: "#1A1A24"))
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
                        Button { selectedGig = gig } label: {
                            GigCard(
                                gig: gig,
                                isReported: reportedIds.contains(gig.id) || gig.reported,
                                surface: surface,
                                border: border,
                                textPri: textPri,
                                textSec: textSec,
                                gold: gold,
                                coral: coral,
                                onReport: { confirmReportId = gig.id }
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
                .padding(.bottom, 100)
            }
        }
    }
}

// MARK: - Gig Card (tap to open detail sheet)

struct GigCard: View {
    let gig: PostedGig
    let isReported: Bool
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color
    let coral: Color
    let onReport: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
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
                .font(.caption).foregroundColor(textSec).lineLimit(2)

            HStack {
                Spacer()
                Text("Tap to view details")
                    .font(.caption2).foregroundColor(textSec.opacity(0.5))
                Image(systemName: "chevron.right")
                    .font(.caption2).foregroundColor(textSec.opacity(0.5))
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

// MARK: - Gig Detail Sheet

struct GigDetailSheet: View {
    let gig: PostedGig
    let isReported: Bool
    @ObservedObject var service: FirestoreService
    let onReport: () -> Void

    @Environment(\.dismiss) private var dismiss

    private let bg      = Color(hex: "#1A1A24")
    private let surface = Color(hex: "#0F0F13")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")
    private let coral   = Color(hex: "#E8724A")

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // Header
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(gig.title)
                            .font(.title2).fontWeight(.bold)
                            .foregroundColor(textPri)
                        HStack(spacing: 6) {
                            TagChip(text: gig.category, textColor: textSec)
                            TagChip(text: "\(gig.payAmount) / \(gig.payType)", textColor: gold)
                        }
                    }
                    Spacer()
                    Button(action: { onReport(); dismiss() }) {
                        Image(systemName: isReported ? "flag.fill" : "flag")
                            .foregroundColor(isReported ? coral : textSec)
                            .padding(8)
                            .background(surface)
                            .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .disabled(isReported)
                }

                Divider().background(border)

                // Description
                VStack(alignment: .leading, spacing: 6) {
                    Label("Description", systemImage: "text.alignleft")
                        .font(.caption).fontWeight(.semibold)
                        .foregroundColor(textSec)
                    Text(gig.description)
                        .font(.subheadline)
                        .foregroundColor(textPri)
                }

                // Address
                if !gig.address.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Address", systemImage: "mappin.circle.fill")
                            .font(.caption).fontWeight(.semibold)
                            .foregroundColor(textSec)
                        Text(gig.address)
                            .font(.subheadline)
                            .foregroundColor(textPri)
                    }
                }

                // Date
                if let date = gig.preferredDate {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Preferred Date", systemImage: "calendar")
                            .font(.caption).fontWeight(.semibold)
                            .foregroundColor(textSec)
                        Text(date)
                            .font(.subheadline)
                            .foregroundColor(textPri)
                    }
                }

                // Poster
                VStack(alignment: .leading, spacing: 6) {
                    Label("Posted by", systemImage: "person.circle")
                        .font(.caption).fontWeight(.semibold)
                        .foregroundColor(textSec)
                    Text(gig.posterName)
                        .font(.subheadline)
                        .foregroundColor(textPri)
                }

                Divider().background(border)

                // Phone — always shown in detail view
                VStack(alignment: .leading, spacing: 10) {
                    Label("Contact", systemImage: "phone.fill")
                        .font(.caption).fontWeight(.semibold)
                        .foregroundColor(textSec)

                    // Tap to call
                    if let url = URL(string: "tel:\(gig.posterPhone.filter { $0.isNumber })") {
                        Link(destination: url) {
                            HStack(spacing: 10) {
                                Image(systemName: "phone.fill")
                                    .foregroundColor(.black)
                                Text(gig.posterPhone)
                                    .font(.subheadline).fontWeight(.semibold)
                                    .foregroundColor(.black)
                                Spacer()
                                Text("Call")
                                    .font(.caption).fontWeight(.bold)
                                    .foregroundColor(.black)
                            }
                            .padding(14)
                            .background(gold)
                            .cornerRadius(12)
                        }
                    }
                }

                // Directions button
                if !gig.address.isEmpty {
                    let encoded = gig.address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                    if let mapsURL = URL(string: "maps://?q=\(encoded)") {
                        Link(destination: mapsURL) {
                            HStack {
                                Spacer()
                                Image(systemName: "map.fill")
                                Text("Get Directions")
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                            .foregroundColor(.white)
                            .padding(14)
                            .background(sage)
                            .cornerRadius(12)
                        }
                    }
                }

                if isReported {
                    Text("Reported — under review")
                        .font(.caption2).foregroundColor(coral)
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                Spacer(minLength: 20)
            }
            .padding(24)
        }
        .background(bg.ignoresSafeArea())
    }
}
