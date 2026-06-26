//
//  GeocodingService.swift
//  WorkTeen
//
//  Geocodes address strings to CLLocationCoordinate2D using CLGeocoder.
//  Results are cached in memory for the session to avoid redundant requests.
//

import CoreLocation

final class GeocodingService {
    static let shared = GeocodingService()
    private init() {}

    private let geocoder = CLGeocoder()
    private var cache: [String: CLLocationCoordinate2D] = [:]

    /// Geocodes an address string. Returns nil if the address cannot be resolved.
    /// Failures are logged but never propagate as crashes — callers skip the pin silently.
    func geocode(address: String) async throws -> CLLocationCoordinate2D? {
        let key = address.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if key.isEmpty { return nil }
        if let cached = cache[key] { return cached }

        do {
            let placemarks = try await geocoder.geocodeAddressString(address)
            guard let location = placemarks.first?.location else {
                print("GeocodingService: no placemark for "\(address)"")
                return nil
            }
            let coordinate = location.coordinate
            cache[key] = coordinate
            return coordinate
        } catch {
            // Log so the admin can identify bad addresses in Firestore.
            print("GeocodingService: failed to geocode "\(address)" — \(error.localizedDescription)")
            return nil
        }
    }

    /// Returns a coordinate randomly offset by ~0.1–0.2 miles in a random direction.
    /// Used for gig pins so the poster's exact home address is never revealed on the map.
    func approximateCoordinate(from coordinate: CLLocationCoordinate2D) -> CLLocationCoordinate2D {
        let radiusInDegrees = Double.random(in: 0.0015...0.003)
        let angle = Double.random(in: 0..<(2 * .pi))
        return CLLocationCoordinate2D(
            latitude:  coordinate.latitude  + radiusInDegrees * cos(angle),
            longitude: coordinate.longitude + radiusInDegrees * sin(angle)
        )
    }
}
