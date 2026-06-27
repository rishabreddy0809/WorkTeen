//
//  JobsMapView.swift
//  WorkTeen
//
//  Redesigned map view: header + location chip + radius slider + compact map
//  + category chips + count label + scrollable results list.
//  Gig pins are plotted at an approximated coordinate — never the real address.
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

    // MARK: State
    @State private var jobPins:  [JobPin] = []
    @State private var gigPins:  [GigPin] = []
    @State private var position: MapCameraPosition = .automatic
    @State private var selectedJobPin: JobPin? = nil
    @State private var selectedGigPin: GigPin? = nil
    @State private var confirmReportId: String? = nil

    @State private var radiusMiles: Double = 10
    @State private var cityName: String? = nil
    @State private var centerCoord: CLLocationCoordinate2D? = nil
    @State private var selectedCategory: String? = nil

    private let geocoder = GeocodingService.shared

    // Design system
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")
    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let coral   = Color(hex: "#E8724A")
    private let green   = Color(hex: "#34C759")

    // MARK: Computed

    private var allCategories: [String] {
        let jobCats = jobs.map { $0.category }
        let gigCats = gigs.map { $0.category }
        return Array(Set(jobCats + gigCats)).sorted()
    }

    /// Pins filtered by radius and category
    private var filteredJobPins: [JobPin] {
        jobPins.filter { pin in
            let inRadius = centerCoord.map { distanceMiles(from: $0, to: pin.coordinate) <= radiusMiles } ?? true
            let inCat = selectedCategory == nil || pin.job.category == selectedCategory
            return inRadius && inCat
        }
    }

    private var filteredGigPins: [GigPin] {
        gigPins.filter { pin in
            let inRadius = centerCoord.map { distanceMiles(from: $0, to: pin.coordinate) <= radiusMiles } ?? true
            let inCat = selectedCategory == nil || pin.gig.category == selectedCategory
            return inRadius && inCat
        }
    }

    private var totalNearby: Int { filteredJobPins.count + filteredGigPins.count }

    // Jobs sorted by distance for the list
    private var sortedJobPins: [JobPin] {
        guard let center = centerCoord else { return filteredJobPins }
        return filteredJobPins.sorted { distanceMiles(from: center, to: $0.coordinate) < distanceMiles(from: center, to: $1.coordinate) }
    }

    private var sortedGigPins: [GigPin] {
        guard let center = centerCoord else { return filteredGigPins }
        return filteredGigPins.sorted { distanceMiles(from: center, to: $0.coordinate) < distanceMiles(from: center, to: $1.coordinate) }
    }

    // MARK: Body

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                headerSection
                radiusSection
                mapSection
                categoryChipsSection
                countSection
                resultsList
                Spacer(minLength: 110)
            }
        }
        .background(bg.ignoresSafeArea())
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
        // Gig callout sheet — safe, no address, no phone before reveal
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
        .task(id: teen.zip) { await loadZipInfo() }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Nearby Jobs")
                    .font(.title2).fontWeight(.bold)
                    .foregroundColor(textPri)
                Text("Eligible listings within \(Int(radiusMiles)) miles of you.")
                    .font(.subheadline)
                    .foregroundColor(textSec)
            }
            Spacer()
            if let city = cityName {
                HStack(spacing: 5) {
                    Image(systemName: "location.fill")
                        .font(.caption2)
                    Text(city)
                        .font(.caption).fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(green)
                .cornerRadius(20)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    // MARK: - Radius Slider

    private var radiusSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .foregroundColor(textSec)
                    .font(.subheadline)
                Text("Search radius")
                    .font(.subheadline)
                    .foregroundColor(textPri)
                Spacer()
                Text("\(Int(radiusMiles)) miles")
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundColor(gold)
            }
            Slider(value: $radiusMiles, in: 1...300, step: 1)
                .tint(green)
            HStack {
                Text("1 mi")
                    .font(.caption2).foregroundColor(textSec)
                Spacer()
                Text("300 mi")
                    .font(.caption2).foregroundColor(textSec)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }

    // MARK: - Compact Map

    private var mapSection: some View {
        Map(position: $position) {
            // Job pins — gold, eligible only
            ForEach(filteredJobPins) { pin in
                Annotation(pin.job.title, coordinate: pin.coordinate) {
                    JobPinView(color: gold)
                        .onTapGesture { selectedJobPin = pin }
                }
            }
            // Gig pins — sage, approximate location only
            ForEach(filteredGigPins) { pin in
                Annotation(pin.gig.title, coordinate: pin.coordinate) {
                    GigPinView(color: sage)
                        .onTapGesture {
                            selectedGigPin = pin
                        }
                }
            }
            UserAnnotation()
        }
        .mapStyle(.standard(elevation: .realistic))
        .mapControls {
            MapUserLocationButton()
            MapCompass()
        }
        .frame(height: 220)
        .cornerRadius(16)
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
    }

    // MARK: - Category Chips

    private var categoryChipsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                categoryChip(label: "All", icon: "square.grid.2x2.fill", isActive: selectedCategory == nil) {
                    selectedCategory = nil
                }
                ForEach(allCategories, id: \.self) { cat in
                    categoryChip(label: cat, icon: iconForCategory(cat), isActive: selectedCategory == cat) {
                        selectedCategory = selectedCategory == cat ? nil : cat
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 2)
        }
        .padding(.bottom, 12)
    }

    private func categoryChip(label: String, icon: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.caption2)
                Text(label)
                    .font(.caption).fontWeight(isActive ? .semibold : .regular)
            }
            .foregroundColor(isActive ? .black : textSec)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isActive ? gold : surface)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(isActive ? gold : border, lineWidth: 1))
            .cornerRadius(20)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Count Label

    private var countSection: some View {
        Text("\(totalNearby) NEARBY")
            .font(.caption).fontWeight(.bold)
            .foregroundColor(textSec)
            .tracking(1.2)
            .padding(.horizontal, 16)
            .padding(.bottom, 10)
    }

    // MARK: - Results List

    private var resultsList: some View {
        VStack(spacing: 0) {
            // Jobs
            ForEach(sortedJobPins) { pin in
                NavigationLink(destination: ApplyView(job: pin.job, teen: teen, service: service)) {
                    ResultRow(
                        icon: "briefcase.fill",
                        iconColor: gold,
                        title: pin.job.title,
                        subtitle: pin.job.employerName,
                        category: pin.job.category,
                        distance: centerCoord.map { distanceMiles(from: $0, to: pin.coordinate) },
                        detail: pin.job.address,
                        surface: surface,
                        border: border,
                        textPri: textPri,
                        textSec: textSec,
                        gold: gold
                    )
                }
                .buttonStyle(.plain)

                if pin.id != sortedJobPins.last?.id || !sortedGigPins.isEmpty {
                    Divider()
                        .background(border)
                        .padding(.leading, 68)
                }
            }
            // Gigs
            ForEach(sortedGigPins) { pin in
                Button {
                    selectedGigPin = pin
                } label: {
                    ResultRow(
                        icon: "list.bullet.rectangle.portrait",
                        iconColor: sage,
                        title: pin.gig.title,
                        subtitle: pin.gig.posterName,
                        category: pin.gig.category,
                        distance: centerCoord.map { distanceMiles(from: $0, to: pin.coordinate) },
                        detail: "Near \(pin.gig.zip)",
                        surface: surface,
                        border: border,
                        textPri: textPri,
                        textSec: textSec,
                        gold: sage
                    )
                }
                .buttonStyle(.plain)

                if pin.id != sortedGigPins.last?.id {
                    Divider()
                        .background(border)
                        .padding(.leading, 68)
                }
            }

            if totalNearby == 0 {
                VStack(spacing: 8) {
                    Image(systemName: "map")
                        .font(.largeTitle)
                        .foregroundColor(textSec)
                    Text("No listings within \(Int(radiusMiles)) miles")
                        .font(.subheadline)
                        .foregroundColor(textSec)
                    Text("Try increasing the search radius.")
                        .font(.caption)
                        .foregroundColor(textSec.opacity(0.6))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            }
        }
        .background(surface)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(border, lineWidth: 1))
        .padding(.horizontal, 16)
    }

    // MARK: - Async tasks

    private func loadZipInfo() async {
        async let coord = geocoder.geocode(address: teen.zip)
        async let city = geocoder.cityName(forZip: teen.zip)
        if let c = try? await coord {
            centerCoord = c
            let span = MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12)
            position = .region(MKCoordinateRegion(center: c, span: span))
        }
        cityName = await city
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
                let approx = geocoder.approximateCoordinate(from: realCoord)
                pins.append(GigPin(id: gig.id, gig: gig, coordinate: approx))
            }
        }
        gigPins = pins
    }

    // MARK: - Helpers

    private func distanceMiles(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let a = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let b = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return a.distance(from: b) / 1609.344
    }

    private func iconForCategory(_ cat: String) -> String {
        switch cat.lowercased() {
        case let c where c.contains("food") || c.contains("restaurant"): return "fork.knife"
        case let c where c.contains("retail") || c.contains("shop"):     return "bag.fill"
        case let c where c.contains("tech") || c.contains("it"):         return "laptopcomputer"
        case let c where c.contains("tutor") || c.contains("education"): return "book.fill"
        case let c where c.contains("yard") || c.contains("garden") || c.contains("lawn"): return "leaf.fill"
        case let c where c.contains("care") || c.contains("medical"):    return "cross.fill"
        case let c where c.contains("pet"):                               return "pawprint.fill"
        case let c where c.contains("clean"):                             return "sparkles"
        default: return "briefcase.fill"
        }
    }
}

// MARK: - Result Row

private struct ResultRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    let category: String
    let distance: Double?
    let detail: String
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color

    var body: some View {
        HStack(spacing: 12) {
            // Icon bubble
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(iconColor.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(iconColor)
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline) {
                    Text(title)
                        .font(.subheadline).fontWeight(.semibold)
                        .foregroundColor(textPri)
                        .lineLimit(1)
                    Spacer()
                    if let d = distance {
                        Text(String(format: "%.1f mi", d))
                            .font(.caption).fontWeight(.medium)
                            .foregroundColor(textSec)
                    }
                }
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(textSec)
                    .lineLimit(1)
                Text(detail)
                    .font(.caption2)
                    .foregroundColor(textSec.opacity(0.7))
                    .lineLimit(1)
            }

            Image(systemName: "chevron.right")
                .font(.caption2)
                .foregroundColor(textSec.opacity(0.5))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(surface)
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
