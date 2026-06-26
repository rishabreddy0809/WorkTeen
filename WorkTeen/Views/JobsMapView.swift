//
//  JobsMapView.swift
//  WorkTeen
//
//  Shows eligible job listings (gold pins) and approved gigs (sage pins) on a map.
//  Gig pins are plotted at an approximated coordinate — never the real address.
//  Tapping a job pin navigates to ApplyView; tapping a gig pin shows a safe callout
//  (title + category only, no address or contact info).
//

import SwiftUI
import MapKit
import CoreLocation

// MARK: - Pin models

struct JobPin: Identifiable {
    let id: String
    let job: JobListing
    let coordinate: CLLocationCoordinate2D
}

struct GigPin: Identifiable {
    let id: String
    let gig: PostedGig
    // Always the APPROXIMATE coordinate — the real one is never stored here.
    let coordinate: CLLocationCoordinate2D
}

// MARK: - JobsMapView

struct JobsMapView: View {
    let jobs: [JobListing]   // already filtered to eligible-only before this view
    let gigs: [PostedGig]
    let teen: Teen
    @ObservedObject var service: FirestoreService

    // Revealed contacts set passed in from TasksView so the same gate applies
    @Binding var revealedContacts: Set<String>
    @Binding var reportedIds: Set<String>

    @State private var jobPins:  [JobPin] = []
    @State private var gigPins:  [GigPin] = []
    @State private var position: MapCameraPosition = .automatic
    @State private var selectedJobPin: JobPin? = nil
    @State private var selectedGigPin: GigPin? = nil
    @State private var showGigSheet   = false
    @State private var confirmReportId: String? = nil

    private let geocoder = GeocodingService.shared

    private let gold  = Color(hex: "#F5A623")
    private let sage  = Color(hex: "#4CAF82")
    private let bg    = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let coral   = Color(hex: "#E8724A")

    var body: some View {
        Map(position: $position) {
            // Job pins — gold, eligible only
            ForEach(jobPins) { pin in
                Annotation(pin.job.title, coordinate: pin.coordinate) {
                    JobPinView(color: gold)
                        .onTapGesture { selectedJobPin = pin }
                }
            }

            // Gig pins — sage, approximate location only
            ForEach(gigPins) { pin in
                Annotation(pin.gig.title, coordinate: pin.coordinate) {
                    GigPinView(color: sage)
                        .onTapGesture {
                            selectedGigPin = pin
                            showGigSheet = true
                        }
                }
            }

            UserAnnotation()
        }
        .mapStyle(.standard(elevation: .realistic))
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
        // Job callout sheet
        .sheet(item: $selectedJobPin) { pin in
            JobCalloutSheet(
                pin: pin,
                teen: teen,
                service: service,
                gold: gold,
                surface: surface,
                border: border,
                textPri: textPri,
                textSec: textSec
            )
            .presentationDetents([.height(280)])
            .presentationDragIndicator(.visible)
            .presentationBackground(surface)
        }
        // Gig callout sheet — safe, no address, no phone
        .sheet(item: $selectedGigPin) { pin in
            GigCalloutSheet(
                pin: pin,
                isRevealed: revealedContacts.contains(pin.gig.id),
                isReported: reportedIds.contains(pin.gig.id) || pin.gig.reported,
                service: service,
                onReveal: { revealedContacts.insert(pin.gig.id) },
                onReport: { confirmReportId = pin.gig.id },
                sage: sage,
                gold: gold,
                surface: surface,
                border: border,
                textPri: textPri,
                textSec: textSec,
                coral: coral
            )
            .presentationDetents([.height(320)])
            .presentationDragIndicator(.visible)
            .presentationBackground(surface)
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
            Text("This gig will be flagged for review.")
        }
        .task(id: jobs.map(\.id).joined()) { await geocodeJobs() }
        .task(id: gigs.map(\.id).joined()) { await geocodeGigs() }
        .task(id: teen.zip) { await centerOnZip() }
    }

    // MARK: - Geocoding

    private func centerOnZip() async {
        guard let coord = try? await geocoder.geocode(address: teen.zip) else { return }
        let span = MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12)
        let region = MKCoordinateRegion(center: coord, span: span)
        position = .region(region)
    }

    private func geocodeJobs() async {
        var pins: [JobPin] = []
        for job in jobs {
            guard !job.address.isEmpty else { continue }
            if let coord = try? await geocoder.geocode(address: job.address) {
                pins.append(JobPin(id: job.id, job: job, coordinate: coord))
            }
        }
        jobPins = pins
    }

    private func geocodeGigs() async {
        var pins: [GigPin] = []
        for gig in gigs {
            guard !gig.address.isEmpty else { continue }
            if let realCoord = try? await geocoder.geocode(address: gig.address) {
                // Always use the approximate coordinate — never expose the real one.
                let approx = geocoder.approximateCoordinate(from: realCoord)
                pins.append(GigPin(id: gig.id, gig: gig, coordinate: approx))
            }
        }
        gigPins = pins
    }
}

// MARK: - Pin marker views

private struct JobPinView: View {
    let color: Color
    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 32, height: 32)
                .shadow(color: color.opacity(0.5), radius: 4, x: 0, y: 2)
            Image(systemName: "briefcase.fill")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.black)
        }
    }
}

private struct GigPinView: View {
    let color: Color
    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 32, height: 32)
                .shadow(color: color.opacity(0.5), radius: 4, x: 0, y: 2)
            Image(systemName: "list.bullet")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.black)
        }
    }
}

// MARK: - Job callout sheet

private struct JobCalloutSheet: View {
    let pin: JobPin
    let teen: Teen
    @ObservedObject var service: FirestoreService
    let gold: Color
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(pin.job.title)
                        .font(.title3).fontWeight(.bold)
                        .foregroundColor(textPri)
                    Text(pin.job.employerName)
                        .font(.subheadline)
                        .foregroundColor(textSec)
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.circle")
                            .foregroundColor(textSec)
                            .font(.caption)
                        Text(pin.job.address)
                            .font(.caption)
                            .foregroundColor(textSec)
                    }
                }

                HStack(spacing: 8) {
                    TagChip(text: pin.job.category, textColor: textSec)
                    TagChip(text: "Age \(pin.job.minimumAge)+", textColor: textSec)
                    Spacer()
                    Text(pin.job.payRate)
                        .font(.subheadline).fontWeight(.bold)
                        .foregroundColor(gold)
                }

                Spacer()

                NavigationLink(destination: ApplyView(job: pin.job, teen: teen, service: service)) {
                    HStack {
                        Spacer()
                        Text("View & Apply")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    .padding(14)
                    .background(gold)
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded { dismiss() })
            }
            .padding(24)
            .background(surface)
        }
    }
}

// MARK: - Gig callout sheet (safe — no address, no phone before reveal)

private struct GigCalloutSheet: View {
    let pin: GigPin
    let isRevealed: Bool
    let isReported: Bool
    @ObservedObject var service: FirestoreService
    let onReveal: () -> Void
    let onReport: () -> Void
    let sage: Color
    let gold: Color
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let coral: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(pin.gig.title)
                        .font(.title3).fontWeight(.bold)
                        .foregroundColor(textPri)
                    // Category and approximate area — never the real address
                    HStack(spacing: 6) {
                        Image(systemName: "location.circle")
                            .foregroundColor(sage)
                            .font(.caption)
                        Text("\(pin.gig.category) · near \(pin.gig.zip)")
                            .font(.caption)
                            .foregroundColor(textSec)
                    }
                }
                Spacer()
                Button(action: onReport) {
                    Image(systemName: isReported ? "flag.fill" : "flag")
                        .foregroundColor(isReported ? coral : textSec)
                }
                .buttonStyle(.plain)
                .disabled(isReported)
            }

            HStack(spacing: 4) {
                Text("Pay:")
                    .font(.caption).foregroundColor(textSec)
                Text("\(pin.gig.payAmount) / \(pin.gig.payType)")
                    .font(.caption).fontWeight(.bold)
                    .foregroundColor(gold)
            }

            Text(pin.gig.description)
                .font(.caption)
                .foregroundColor(textSec)
                .lineLimit(3)

            // Contact reveal — same gate as the list view
            if isRevealed {
                HStack(spacing: 6) {
                    Image(systemName: "phone.fill")
                        .font(.caption).foregroundColor(gold)
                    Text(pin.gig.posterPhone)
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
                    .font(.caption2).foregroundColor(coral)
            }
        }
        .padding(24)
    }
}
