//
//  HomeView.swift
//  WorkTeen
//
//  Welcome screen: teen greeting, eligibility banner, recommended jobs, recent gigs.
//  All data sourced live from Firestore via FirestoreService.
//

import SwiftUI

struct HomeView: View {
    let teen: Teen
    @ObservedObject var service: FirestoreService

    @State private var jobs: [JobListing] = []
    @State private var gigs: [PostedGig] = []

    // Design colors
    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")

    // Eligible jobs for banner + recommendations
    private var eligibleJobs: [JobListing] {
        jobs.filter { EligibilityEngine.isEligible(teen: teen, job: $0) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back, \(teen.name)")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(textPri)

                        HStack(spacing: 8) {
                            Pill(text: "\(teen.age) yrs", color: gold)
                            Pill(text: teen.state, color: textSec)
                            Pill(text: teen.zip, color: textSec)
                        }
                    }
                    .padding(.horizontal)

                    // Eligibility banner
                    EligibilityBanner(
                        eligible: eligibleJobs.count,
                        total: jobs.count,
                        sage: sage,
                        gold: gold,
                        textPri: textPri,
                        surface: surface,
                        border: border
                    )
                    .padding(.horizontal)

                    // Recommended for you
                    if !eligibleJobs.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Recommended for you", textPri: textPri)
                                .padding(.horizontal)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(eligibleJobs.prefix(6)) { job in
                                        NavigationLink(destination: ApplyView(job: job, teen: teen, service: service)) {
                                            RecommendedJobCard(job: job, surface: surface, border: border, textPri: textPri, textSec: textSec, gold: gold)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }

                    // Recently posted gigs
                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Recently posted", textPri: textPri)
                            .padding(.horizontal)

                        if gigs.isEmpty {
                            Text("No gigs right now — check back soon.")
                                .font(.subheadline)
                                .foregroundColor(textSec)
                                .padding(.horizontal)
                        } else {
                            ForEach(gigs.prefix(5)) { gig in
                                GigRowHome(gig: gig, surface: surface, border: border, textPri: textPri, textSec: textSec, gold: gold)
                                    .padding(.horizontal)
                            }
                        }
                    }

                    Spacer(minLength: 40)
                }
                .padding(.top, 20)
            }
            .background(bg.ignoresSafeArea())
            .navigationBarHidden(true)
        }
        .onAppear {
            service.listenToActiveJobs { self.jobs = $0.sorted { $0.datePosted > $1.datePosted } }
            service.listenToApprovedGigs { self.gigs = $0.sorted { $0.datePosted > $1.datePosted } }
        }
    }
}

// MARK: - Subviews

private struct Pill: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(color.opacity(0.4), lineWidth: 1))
    }
}

private struct EligibilityBanner: View {
    let eligible: Int
    let total: Int
    let sage: Color
    let gold: Color
    let textPri: Color
    let surface: Color
    let border: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.seal.fill")
                .foregroundColor(sage)
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text("You qualify for \(eligible) of \(total) active jobs")
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundColor(textPri)
                Text("Ineligible jobs appear grayed out in the Jobs tab")
                    .font(.caption)
                    .foregroundColor(Color(hex: "#9B9AAF"))
            }
            Spacer()
        }
        .padding(14)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}

private struct SectionHeader: View {
    let title: String
    let textPri: Color
    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundColor(textPri)
    }
}

private struct RecommendedJobCard: View {
    let job: JobListing
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(job.title)
                .font(.subheadline).fontWeight(.semibold)
                .foregroundColor(textPri)
                .lineLimit(2)
            Text(job.employerName)
                .font(.caption)
                .foregroundColor(textSec)
            Spacer()
            Text(job.payRate)
                .font(.caption).fontWeight(.bold)
                .foregroundColor(gold)
            Text(job.category)
                .font(.caption2)
                .foregroundColor(textSec)
        }
        .padding(14)
        .frame(width: 150, height: 130)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}

private struct GigRowHome: View {
    let gig: PostedGig
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(gig.title)
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundColor(textPri)
                Text("\(gig.category) · \(gig.zip)")
                    .font(.caption)
                    .foregroundColor(textSec)
            }
            Spacer()
            Text("\(gig.payAmount) / \(gig.payType)")
                .font(.caption).fontWeight(.bold)
                .foregroundColor(gold)
        }
        .padding(14)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
    }
}
