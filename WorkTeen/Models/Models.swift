//
//  Models.swift
//  WorkTeen
//
//  All app-wide data models. These are Codable for Firestore read/write.
//

import Foundation

struct Teen: Identifiable, Codable {
    let id: UUID
    var name: String
    var age: Int
    var state: String
    var zip: String
    var bio: String
    var availability: [String]
}

struct JobListing: Identifiable, Codable {
    let id: String
    var title: String
    var employerName: String
    var category: String
    var minimumAge: Int
    var maxHoursSchoolDay: Int?
    var latestShiftEndSchoolNight: String?
    var payRate: String
    var description: String
    var datePosted: Date
    var status: String // "active" or "filled"
    // Full business address shown exactly on the map (e.g. "1234 Maple Ave, Shrewsbury, MA").
    // NOTE: the /post-job and /admin job-add forms on the website must include an "address"
    // text input so this field is populated in Firestore — the map cannot plot pins without it.
    var address: String
}

struct PostedGig: Identifiable, Codable {
    let id: String
    var title: String
    var description: String
    var category: String
    var payAmount: String
    var payType: String
    var posterName: String
    var posterPhone: String
    var zip: String
    var preferredDate: String? // stored as "YYYY-MM-DD" string by the website form, not a Timestamp
    var status: String // only ever read here, never written from the app
    var datePosted: Date
    var reported: Bool
    // Poster's address — SENSITIVE. Never display this string directly until after
    // the existing "reveal contact" tap. On the map, plot only an approximated coordinate,
    // never the real geocoded pin. See GeocodingService.approximateCoordinate().
    // NOTE: the /post-gig form on the website must include an "address" text input
    // for this field to be populated in Firestore.
    var address: String
}

struct Application: Identifiable, Codable {
    let id: String
    var jobId: String
    var jobTitle: String
    var employerName: String
    var status: String // "applied", "viewed", "interview", "hired", "notSelected"
    var appliedDate: Date
}
