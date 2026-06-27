//
//  GeocodingService.swift
//  WorkTeen
//
//  Geocodes address strings to CLLocationCoordinate2D using the modern MKGeocodingRequest /
//  MKReverseGeocodingRequest APIs (iOS 26+). Results are cached in memory for the session.
//

import MapKit
import CoreLocation

final class GeocodingService {
    static let shared = GeocodingService()
    private init() {}

    private var cache: [String: CLLocationCoordinate2D] = [:]
    private var cityCache: [String: String] = [:]

    /// Geocodes an address string. Returns nil if the address cannot be resolved.
    /// Failures are logged but never propagate as crashes — callers skip the pin silently.
    func geocode(address: String) async throws -> CLLocationCoordinate2D? {
        let key = address.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if key.isEmpty { return nil }
        if let cached = cache[key] { return cached }

        guard let request = MKGeocodingRequest(addressString: address) else { return nil }
        do {
            let items = try await request.mapItems
            guard let item = items.first else {
                print("GeocodingService: no result for '\(address)'")
                return nil
            }
            let coordinate = item.location.coordinate
            cache[key] = coordinate
            return coordinate
        } catch {
            print("GeocodingService: failed to geocode '\(address)' — \(error.localizedDescription)")
            return nil
        }
    }

    /// Reverse geocodes a zip code to a "City, CA" display string using MKReverseGeocodingRequest.
    /// Returns nil if the zip cannot be resolved.
    func cityName(forZip zip: String) async -> String? {
        let key = zip.trimmingCharacters(in: .whitespacesAndNewlines)
        if key.isEmpty { return nil }
        if let cached = cityCache[key] { return cached }

        guard let coord = try? await geocode(address: key) else { return nil }

        let location = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        guard let request = MKReverseGeocodingRequest(location: location) else { return nil }
        do {
            let items = try await request.mapItems
            if let reps = items.first?.addressRepresentations {
                // cityWithContext gives "San Francisco, CA" style string automatically
                let result = reps.cityWithContext ?? reps.cityName ?? ""
                if !result.isEmpty { cityCache[key] = result }
                return result.isEmpty ? nil : result
            }
        } catch {
            print("GeocodingService: reverse geocode failed for '\(key)' — \(error.localizedDescription)")
        }
        return nil
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
