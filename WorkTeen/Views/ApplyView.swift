//
//  ApplyView.swift
//  WorkTeen
//
//  Job detail + application submission. Bio is pre-filled from the saved Teen
//  profile. Availability toggles are shown for the days in teen.availability.
//  Submitting writes a real Application document to Firestore.
//

import SwiftUI

struct ApplyView: View {
    let job: JobListing
    let teen: Teen
    @ObservedObject var service: FirestoreService
    @Environment(\.dismiss) private var dismiss

    @State private var bio: String = ""
    @State private var selectedDays: Set<String> = []
    @State private var isSubmitting = false
    @State private var submitted = false
    @State private var errorMessage: String? = nil

    private let allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")
    private let coral   = Color(hex: "#E8724A")

    private var canApply: Bool {
        EligibilityEngine.isEligible(teen: teen, job: job)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // Job header
                VStack(alignment: .leading, spacing: 6) {
                    Text(job.title)
                        .font(.title2).fontWeight(.bold)
                        .foregroundColor(textPri)
                    Text(job.employerName)
                        .font(.subheadline)
                        .foregroundColor(textSec)
                    HStack(spacing: 8) {
                        TagChip(text: job.category, textColor: textSec)
                        TagChip(text: "Age \(job.minimumAge)+", textColor: textSec)
                        Text(job.payRate)
                            .font(.caption).fontWeight(.bold)
                            .foregroundColor(gold)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(surface)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                .cornerRadius(12)

                // Job description
                VStack(alignment: .leading, spacing: 8) {
                    Label("About the role", systemImage: "doc.text")
                        .font(.headline)
                        .foregroundColor(textPri)
                    Text(job.description)
                        .font(.body)
                        .foregroundColor(textSec)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(16)
                .background(surface)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                .cornerRadius(12)

                // Details chips
                VStack(alignment: .leading, spacing: 10) {
                    Label("Details", systemImage: "info.circle")
                        .font(.headline)
                        .foregroundColor(textPri)
                    if let maxHours = job.maxHoursSchoolDay {
                        DetailRow(label: "Max hours (school day)", value: "\(maxHours) hrs", textSec: textSec, textPri: textPri)
                    }
                    if let latestEnd = job.latestShiftEndSchoolNight {
                        DetailRow(label: "Latest shift end (school night)", value: latestEnd, textSec: textSec, textPri: textPri)
                    }
                    DetailRow(label: "Posted", value: job.datePosted.formatted(date: .abbreviated, time: .omitted), textSec: textSec, textPri: textPri)
                }
                .padding(16)
                .background(surface)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                .cornerRadius(12)

                if !canApply {
                    // Ineligibility notice — disable submission
                    HStack(spacing: 8) {
                        Image(systemName: "xmark.circle.fill").foregroundColor(coral)
                        Text(EligibilityEngine.ineligibilityReason(teen: teen, job: job) ?? "You are not eligible for this job.")
                            .font(.subheadline)
                            .foregroundColor(coral)
                    }
                    .padding(14)
                    .background(coral.opacity(0.1))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(coral.opacity(0.4), lineWidth: 1))
                    .cornerRadius(10)
                } else if submitted {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill").foregroundColor(sage)
                        Text("Application submitted!")
                            .font(.subheadline).fontWeight(.semibold)
                            .foregroundColor(sage)
                    }
                    .padding(14)
                    .background(sage.opacity(0.1))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(sage.opacity(0.4), lineWidth: 1))
                    .cornerRadius(10)
                } else {
                    // Bio
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your bio")
                            .font(.headline)
                            .foregroundColor(textPri)
                        Text("Tell this employer a bit about yourself.")
                            .font(.caption)
                            .foregroundColor(textSec)
                        TextEditor(text: $bio)
                            .foregroundColor(textPri)
                            .scrollContentBackground(.hidden)
                            .background(Color.clear)
                            .frame(minHeight: 100)
                            .tint(gold)
                    }
                    .padding(16)
                    .background(surface)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                    .cornerRadius(12)

                    // Availability
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Your availability")
                            .font(.headline)
                            .foregroundColor(textPri)
                        Text("Select the days you can work.")
                            .font(.caption)
                            .foregroundColor(textSec)

                        FlowLayout(spacing: 8) {
                            ForEach(allDays, id: \.self) { day in
                                let isOn = selectedDays.contains(day)
                                Button {
                                    if isOn { selectedDays.remove(day) }
                                    else { selectedDays.insert(day) }
                                } label: {
                                    Text(day)
                                        .font(.caption).fontWeight(isOn ? .semibold : .regular)
                                        .foregroundColor(isOn ? gold : textSec)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(isOn ? gold.opacity(0.15) : Color.clear)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(isOn ? gold : border, lineWidth: 1)
                                        )
                                        .cornerRadius(20)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(16)
                    .background(surface)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                    .cornerRadius(12)

                    if let err = errorMessage {
                        Text(err)
                            .font(.caption)
                            .foregroundColor(coral)
                    }

                    // Submit button
                    Button {
                        Task { await submitApplication() }
                    } label: {
                        HStack {
                            Spacer()
                            if isSubmitting {
                                ProgressView().tint(.black)
                            } else {
                                Text("Submit Application")
                                    .fontWeight(.semibold)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .background(gold)
                        .foregroundColor(.black)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    .disabled(isSubmitting || bio.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                Spacer(minLength: 40)
            }
            .padding()
        }
        .background(bg.ignoresSafeArea())
        .navigationTitle("Apply")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(bg, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear {
            bio = teen.bio
            selectedDays = Set(teen.availability)
        }
    }

    private func submitApplication() async {
        isSubmitting = true
        errorMessage = nil
        let application = Application(
            id: UUID().uuidString,
            jobId: job.id,
            jobTitle: job.title,
            employerName: job.employerName,
            status: "applied",
            appliedDate: Date()
        )
        do {
            try await service.submitApplication(application)
            submitted = true
        } catch {
            errorMessage = "Submission failed: \(error.localizedDescription)"
        }
        isSubmitting = false
    }
}

// MARK: - Detail Row

private struct DetailRow: View {
    let label: String
    let value: String
    let textSec: Color
    let textPri: Color
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(textSec)
            Spacer()
            Text(value)
                .font(.caption).fontWeight(.medium)
                .foregroundColor(textPri)
        }
    }
}

// MARK: - Simple Flow Layout for day chips

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var rowX: CGFloat = 0
        var rowH: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowX + size.width > width && rowX > 0 {
                height += rowH + spacing
                rowX = 0
                rowH = 0
            }
            rowX += size.width + spacing
            rowH = max(rowH, size.height)
        }
        height += rowH
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var rowX: CGFloat = bounds.minX
        var rowY: CGFloat = bounds.minY
        var rowH: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowX + size.width > bounds.maxX && rowX > bounds.minX {
                rowY += rowH + spacing
                rowX = bounds.minX
                rowH = 0
            }
            subview.place(at: CGPoint(x: rowX, y: rowY), proposal: ProposedViewSize(size))
            rowX += size.width + spacing
            rowH = max(rowH, size.height)
        }
    }
}
