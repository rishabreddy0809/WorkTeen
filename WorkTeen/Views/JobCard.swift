//
//  JobCard.swift
//  WorkTeen
//
//  Reusable job listing card. Grays out ineligible jobs and shows the reason.
//

import SwiftUI

struct JobCard: View {
    let job: JobListing
    let teen: Teen

    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let coral   = Color(hex: "#E8724A")
    private let sage    = Color(hex: "#4CAF82")

    private var eligible: Bool { EligibilityEngine.isEligible(teen: teen, job: job) }
    private var reason: String? { EligibilityEngine.ineligibilityReason(teen: teen, job: job) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(job.title)
                        .font(.subheadline).fontWeight(.semibold)
                        .foregroundColor(eligible ? textPri : textSec)
                    Text(job.employerName)
                        .font(.caption)
                        .foregroundColor(textSec)
                }
                Spacer()
                // Status indicator
                Circle()
                    .fill(eligible ? sage : Color(hex: "#2A2A38"))
                    .frame(width: 10, height: 10)
                    .padding(.top, 4)
            }

            HStack(spacing: 8) {
                TagChip(text: job.category, textColor: textSec)
                TagChip(text: "Age \(job.minimumAge)+", textColor: textSec)
                Spacer()
                Text(job.payRate)
                    .font(.caption).fontWeight(.bold)
                    .foregroundColor(eligible ? gold : textSec)
            }

            if let reason {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(coral)
                    Text(reason)
                        .font(.caption)
                        .foregroundColor(coral)
                }
            }
        }
        .padding(14)
        .background(surface.opacity(eligible ? 1.0 : 0.6))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(eligible ? border : border.opacity(0.4), lineWidth: 1)
        )
        .cornerRadius(12)
        .opacity(eligible ? 1.0 : 0.65)
    }
}

struct TagChip: View {
    let text: String
    let textColor: Color
    var body: some View {
        Text(text)
            .font(.caption2)
            .foregroundColor(textColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color(hex: "#0F0F13"))
            .cornerRadius(6)
    }
}
