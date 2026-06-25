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
    var preferredDate: Date?
    var status: String // only ever read here, never written from the app
    var datePosted: Date
    var reported: Bool
}

struct Application: Identifiable, Codable {
    let id: String
    var jobId: String
    var jobTitle: String
    var employerName: String
    var status: String // "applied", "viewed", "interview", "hired", "notSelected"
    var appliedDate: Date
}
