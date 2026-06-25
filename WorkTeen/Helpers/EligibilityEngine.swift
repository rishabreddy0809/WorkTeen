//
//  EligibilityEngine.swift
//  WorkTeen
//
//  Determines whether a teen is eligible to apply for a given job.
//
//  PLACEHOLDER: This engine currently checks only age against minimumAge.
//  Full state-by-state child labor law enforcement (max hours on school days,
//  latest permitted shift end times, permit requirements, hazardous work
//  restrictions, etc.) will be layered in here later.
//
//  The function signatures (isEligible and ineligibilityReason) are intentionally
//  stable — adding more rules only requires expanding the bodies below, not
//  changing any call sites.
//

import Foundation

struct EligibilityEngine {

    /// Returns true if the teen meets every eligibility requirement for the job.
    static func isEligible(teen: Teen, job: JobListing) -> Bool {
        return teen.age >= job.minimumAge
        // TODO: add state-specific hour/time/permit checks here
    }

    /// Returns a human-readable reason string if the teen is ineligible, or nil if eligible.
    static func ineligibilityReason(teen: Teen, job: JobListing) -> String? {
        if teen.age < job.minimumAge {
            return "Minimum age for this role is \(job.minimumAge)"
        }
        // TODO: add state-specific ineligibility reasons here (hours, shift end, permits)
        return nil
    }
}
