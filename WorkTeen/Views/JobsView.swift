//
//  JobsView.swift
//  WorkTeen
//
//  Full list of active jobs with filter chips, plus a map view toggle.
//  Ineligible jobs are grayed out in list mode; excluded from map mode.
//

import SwiftUI

enum JobsViewMode { case list, map }

struct JobsView: View {
    let teen: Teen
    @ObservedObject var service: FirestoreService

    @State private var jobs: [JobListing] = []
    @State private var selectedCategory: String? = nil
    @State private var showEligibleOnly = false
    @State private var searchText = ""
    @State private var viewMode: JobsViewMode = .list

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")

    private var categories: [String] {
        Array(Set(jobs.map { $0.category })).sorted()
    }

    private var filteredJobs: [JobListing] {
        var result = jobs
        if let cat = selectedCategory {
            result = result.filter { $0.category == cat }
        }
        if showEligibleOnly || viewMode == .map {
            // Map only shows eligible pins; list respects the toggle
            result = result.filter { EligibilityEngine.isEligible(teen: teen, job: $0) }
        }
        if !searchText.isEmpty {
            let q = searchText.lowercased()
            result = result.filter {
                $0.title.lowercased().contains(q) || $0.employerName.lowercased().contains(q)
            }
        }
        return result.sorted {
            let aElig = EligibilityEngine.isEligible(teen: teen, job: $0)
            let bElig = EligibilityEngine.isEligible(teen: teen, job: $1)
            if aElig != bElig { return aElig }
            return $0.datePosted > $1.datePosted
        }
    }

    // Eligible jobs for map — all eligible jobs, geocoding falls back to zip when address is missing
    private var mappableJobs: [JobListing] {
        filteredJobs
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // List/Map toggle
                ViewModeToggle(mode: $viewMode, gold: gold, surface: surface, border: border, textSec: textSec)
                    .padding(.horizontal)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                if viewMode == .list {
                    listControls
                    Divider().background(border)
                    listContent
                } else {
                    JobsMapView(
                        jobs: mappableJobs,
                        gigs: [],
                        teen: teen,
                        service: service,
                        revealedContacts: .constant(Set<String>()),
                        reportedIds: .constant(Set<String>())
                    )
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle(viewMode == .map ? "Map" : "Jobs")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .onAppear {
            service.listenToActiveJobs { self.jobs = $0 }
        }
    }

    // MARK: - List subviews

    private var listControls: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass").foregroundColor(textSec)
                TextField("Search jobs...", text: $searchText)
                    .foregroundColor(textPri)
                    .tint(gold)
            }
            .padding(12)
            .background(surface)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(border, lineWidth: 1))
            .cornerRadius(10)
            .padding(.horizontal)
            .padding(.bottom, 8)

            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(label: "Eligible only", isActive: showEligibleOnly, gold: gold, surface: surface, border: border, textSec: textSec) { showEligibleOnly.toggle() }
                    FilterChip(label: "All categories", isActive: selectedCategory == nil, gold: gold, surface: surface, border: border, textSec: textSec) { selectedCategory = nil }
                    ForEach(categories, id: \.self) { cat in
                        FilterChip(label: cat, isActive: selectedCategory == cat, gold: gold, surface: surface, border: border, textSec: textSec) {
                            selectedCategory = selectedCategory == cat ? nil : cat
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 6)
            }
        }
    }

    @ViewBuilder
    private var listContent: some View {
        if filteredJobs.isEmpty {
            Spacer()
            Text("No jobs match your filters.")
                .font(.subheadline).foregroundColor(textSec)
            Spacer()
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(filteredJobs) { job in
                        NavigationLink(destination: ApplyView(job: job, teen: teen, service: service)) {
                            JobCard(job: job, teen: teen)
                        }
                        .buttonStyle(.plain)
                        .disabled(!EligibilityEngine.isEligible(teen: teen, job: job))
                    }
                }
                .padding(.horizontal)
                .padding(.top, 12)
                .padding(.bottom, 100)
            }
        }
    }
}

// MARK: - View Mode Toggle

struct ViewModeToggle: View {
    @Binding var mode: JobsViewMode
    let gold: Color
    let surface: Color
    let border: Color
    let textSec: Color

    var body: some View {
        HStack(spacing: 0) {
            ModeButton(label: "List", icon: "list.bullet", isActive: mode == .list, gold: gold, surface: surface, border: border, textSec: textSec) { mode = .list }
            ModeButton(label: "Map", icon: "map", isActive: mode == .map, gold: gold, surface: surface, border: border, textSec: textSec) { mode = .map }
        }
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(border, lineWidth: 1))
        .cornerRadius(10)
    }
}

private struct ModeButton: View {
    let label: String
    let icon: String
    let isActive: Bool
    let gold: Color
    let surface: Color
    let border: Color
    let textSec: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                Text(label)
            }
            .font(.subheadline).fontWeight(isActive ? .semibold : .regular)
            .foregroundColor(isActive ? gold : textSec)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(isActive ? gold.opacity(0.12) : Color.clear)
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let label: String
    let isActive: Bool
    let gold: Color
    let surface: Color
    let border: Color
    let textSec: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.caption).fontWeight(isActive ? .semibold : .regular)
                .foregroundColor(isActive ? gold : textSec)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isActive ? gold.opacity(0.15) : surface)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(isActive ? gold : border, lineWidth: 1))
                .cornerRadius(20)
        }
        .buttonStyle(.plain)
    }
}
