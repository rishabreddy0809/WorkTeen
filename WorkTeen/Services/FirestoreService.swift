//
//  FirestoreService.swift
//  WorkTeen
//
//  All Firestore read/write operations for the teen-facing app.
//  Uses snapshot listeners for live data wherever the UI needs real-time updates.
//
//  NOTE: GoogleService-Info.plist must be added to the WorkTeen target before
//  Firebase will connect. See WorkTeenApp.swift for the FirebaseApp.configure() call.
//

import Foundation
import Combine
import FirebaseCore
import FirebaseFirestore

// Key used to persist the device-generated teen profile ID across launches.
private let kTeenIdKey = "worktteen_teen_id"

final class FirestoreService: ObservableObject {

    // Satisfies ObservableObject synthesis; actual state lives in view @State properties.
    @Published private var _tick = 0

    // Returns nil when FirebaseApp has not been configured (missing plist).
    private var db: Firestore? {
        guard FirebaseApp.app() != nil else { return nil }
        return Firestore.firestore()
    }

    // Retained listener registrations — held so they can be removed on deinit.
    private var jobsListener: ListenerRegistration?
    private var gigsListener: ListenerRegistration?
    private var applicationsListener: ListenerRegistration?

    deinit {
        jobsListener?.remove()
        gigsListener?.remove()
        applicationsListener?.remove()
    }

    // MARK: - Teen Profile

    /// Returns the stored device teen ID, creating one if this is the first launch.
    private func teenId() -> String {
        if let existing = UserDefaults.standard.string(forKey: kTeenIdKey) {
            return existing
        }
        let new = UUID().uuidString
        UserDefaults.standard.set(new, forKey: kTeenIdKey)
        return new
    }

    /// Writes (or overwrites) the teen profile document in the "teens" collection.
    func saveTeenProfile(_ teen: Teen) async throws {
        guard let db else { return }
        let id = teenId()
        let data: [String: Any] = [
            "id": teen.id.uuidString,
            "name": teen.name,
            "age": teen.age,
            "state": teen.state,
            "zip": teen.zip,
            "bio": teen.bio,
            "availability": teen.availability
        ]
        try await db.collection("teens").document(id).setData(data, merge: false)
    }

    /// Loads the teen profile for the stored device ID. Returns nil if none exists yet.
    func loadTeenProfile() async throws -> Teen? {
        guard let db else { return nil }
        let id = teenId()
        let snapshot = try await db.collection("teens").document(id).getDocument()
        guard snapshot.exists, let data = snapshot.data() else { return nil }
        return decodeTeen(from: data)
    }

    // MARK: - Jobs (real-time)

    /// Attaches a real-time listener to active job listings.
    /// `onUpdate` is called immediately with the current set and on every change.
    func listenToActiveJobs(onUpdate: @escaping ([JobListing]) -> Void) {
        guard let db else { return }
        jobsListener?.remove()
        jobsListener = db.collection("jobListings")
            .whereField("status", isEqualTo: "active")
            .addSnapshotListener { snapshot, error in
                guard let snapshot else { return }
                let jobs = snapshot.documents.compactMap { doc -> JobListing? in
                    self.decodeJob(from: doc.data(), id: doc.documentID)
                }
                onUpdate(jobs)
            }
    }

    // MARK: - Gigs (real-time)

    /// Attaches a real-time listener to approved gigs.
    func listenToApprovedGigs(onUpdate: @escaping ([PostedGig]) -> Void) {
        guard let db else { return }
        gigsListener?.remove()
        gigsListener = db.collection("gigs")
            .whereField("status", isEqualTo: "approved")
            .addSnapshotListener { snapshot, error in
                guard let snapshot else { return }
                let gigs = snapshot.documents.compactMap { doc -> PostedGig? in
                    self.decodeGig(from: doc.data(), id: doc.documentID)
                }
                onUpdate(gigs)
            }
    }

    /// Sets reported = true on a gig. The status field is never written by the app.
    func reportGig(id: String) async throws {
        guard let db else { return }
        try await db.collection("gigs").document(id).updateData(["reported": true])
    }

    // MARK: - Applications

    /// Writes a new Application document to the "applications" collection.
    func submitApplication(_ application: Application) async throws {
        guard let db else { return }
        let data: [String: Any] = [
            "id": application.id,
            "jobId": application.jobId,
            "jobTitle": application.jobTitle,
            "employerName": application.employerName,
            "status": application.status,
            "appliedDate": Timestamp(date: application.appliedDate),
            "teenId": teenId()
        ]
        try await db.collection("applications").document(application.id).setData(data)
    }

    /// Attaches a real-time listener to all applications for this device's teen.
    func listenToApplications(teenId: String, onUpdate: @escaping ([Application]) -> Void) {
        guard let db else { return }
        applicationsListener?.remove()
        let id = self.teenId()
        applicationsListener = db.collection("applications")
            .whereField("teenId", isEqualTo: id)
            .addSnapshotListener { snapshot, error in
                guard let snapshot else { return }
                let apps = snapshot.documents.compactMap { doc -> Application? in
                    self.decodeApplication(from: doc.data())
                }
                onUpdate(apps)
            }
    }

    // MARK: - Decoding helpers

    private func decodeTeen(from data: [String: Any]) -> Teen? {
        guard
            let idString = data["id"] as? String,
            let id = UUID(uuidString: idString),
            let name = data["name"] as? String,
            let age = data["age"] as? Int,
            let state = data["state"] as? String,
            let zip = data["zip"] as? String
        else { return nil }
        return Teen(
            id: id,
            name: name,
            age: age,
            state: state,
            zip: zip,
            bio: data["bio"] as? String ?? "",
            availability: data["availability"] as? [String] ?? []
        )
    }

    private func decodeJob(from data: [String: Any], id: String) -> JobListing? {
        guard
            let title = data["title"] as? String,
            let employerName = data["employerName"] as? String,
            let category = data["category"] as? String,
            let minimumAge = data["minimumAge"] as? Int,
            let payRate = data["payRate"] as? String,
            let description = data["description"] as? String,
            let status = data["status"] as? String
        else { return nil }
        let datePosted = (data["datePosted"] as? Timestamp)?.dateValue() ?? Date()
        return JobListing(
            id: id,
            title: title,
            employerName: employerName,
            category: category,
            minimumAge: minimumAge,
            maxHoursSchoolDay: data["maxHoursSchoolDay"] as? Int,
            latestShiftEndSchoolNight: data["latestShiftEndSchoolNight"] as? String,
            payRate: payRate,
            description: description,
            datePosted: datePosted,
            status: status
        )
    }

    private func decodeGig(from data: [String: Any], id: String) -> PostedGig? {
        guard
            let title = data["title"] as? String,
            let description = data["description"] as? String,
            let category = data["category"] as? String,
            let payAmount = data["payAmount"] as? String,
            let payType = data["payType"] as? String,
            let posterName = data["posterName"] as? String,
            let posterPhone = data["posterPhone"] as? String,
            let zip = data["zip"] as? String,
            let status = data["status"] as? String
        else { return nil }
        let datePosted = (data["datePosted"] as? Timestamp)?.dateValue() ?? Date()
        let preferredDate = (data["preferredDate"] as? Timestamp)?.dateValue()
        let reported = data["reported"] as? Bool ?? false
        return PostedGig(
            id: id,
            title: title,
            description: description,
            category: category,
            payAmount: payAmount,
            payType: payType,
            posterName: posterName,
            posterPhone: posterPhone,
            zip: zip,
            preferredDate: preferredDate,
            status: status,
            datePosted: datePosted,
            reported: reported
        )
    }

    private func decodeApplication(from data: [String: Any]) -> Application? {
        guard
            let id = data["id"] as? String,
            let jobId = data["jobId"] as? String,
            let jobTitle = data["jobTitle"] as? String,
            let employerName = data["employerName"] as? String,
            let status = data["status"] as? String
        else { return nil }
        let appliedDate = (data["appliedDate"] as? Timestamp)?.dateValue() ?? Date()
        return Application(
            id: id,
            jobId: jobId,
            jobTitle: jobTitle,
            employerName: employerName,
            status: status,
            appliedDate: appliedDate
        )
    }
}
