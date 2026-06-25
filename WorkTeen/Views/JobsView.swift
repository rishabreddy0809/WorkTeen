//
//  JobsView.swift
//  WorkTeen
//
//  Full list of active jobs with filter chips. Ineligible jobs are grayed out
//  (not hidden) and show the ineligibility reason inline on the card.
//

import SwiftUI

struct JobsView: View {
    let teen: Teen
    @ObservedObject var service: FirestoreService

    @State private var jobs: [JobListing] = []
    @State private var selectedCategory: String? = nil
    @State private var showEligibleOnly = false
    @State private var searchText = ""

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
        if showEligibleOnly {
            result = result.filter { EligibilityEngine.isEligible(teen: teen, job: $0) }
        }
        if !searchText.isEmpty {
            let q = searchText.lowercased()
            result = result.filter {
                $0.title.lowercased().contains(q) || $0.employerName.lowercased().contains(q)
            }
        }
        // Eligible first, then by date
        return result.sorted {
            let aElig = EligibilityEngine.isEligible(teen: teen, job: $0)
            let bElig = EligibilityEngine.isEligible(teen: teen, job: $1)
            if aElig != bElig { return aElig }
            return $0.datePosted > $1.datePosted
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(textSec)
                    TextField("Search jobs...", text: $searchText)
                        .foregroundColor(textPri)
                        .tint(gold)
                }
                .padding(12)
                .background(surface)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(border, lineWidth: 1))
                .cornerRadius(10)
                .padding(.horizontal)
                .padding(.top, 12)
                .padding(.bottom, 8)

                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(
                            label: "Eligible only",
                            isActive: showEligibleOnly,
                            gold: gold,
                            surface: surface,
                            border: border,
                            textSec: textSec
                        ) { showEligibleOnly.toggle() }

                        FilterChip(
                            label: "All categories",
                            isActive: selectedCategory == nil,
                            gold: gold,
                            surface: surface,
                            border: border,
                            textSec: textSec
                        ) { selectedCategory = nil }

                        ForEach(categories, id: \.self) { cat in
                            FilterChip(
                                label: cat,
                                isActive: selectedCategory == cat,
                                gold: gold,
                                surface: surface,
                                border: border,
                                textSec: textSec
                            ) {
                                selectedCategory = selectedCategory == cat ? nil : cat
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 6)
                }

                Divider().background(border)

                // Job list
                if filteredJobs.isEmpty {
                    Spacer()
                    Text("No jobs match your filters.")
                        .font(.subheadline)
                        .foregroundColor(textSec)
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
                        .padding(.bottom, 40)
                    }
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Jobs")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .onAppear {
            service.listenToActiveJobs { self.jobs = $0 }
        }
    }
}

// MARK: - Filter Chip

private struct FilterChip: View {
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
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isActive ? gold : border, lineWidth: 1)
                )
                .cornerRadius(20)
        }
        .buttonStyle(.plain)
    }
}
