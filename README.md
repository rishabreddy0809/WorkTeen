# WorkTeen

The first job board built for teens, and the laws that protect them.

## What is WorkTeen

WorkTeen is a job board made specifically for teens ages 13 to 18. It was built by Rishab Reddy, a 14 year old founder from Shrewsbury, Massachusetts, after personally running into the same problem every teen runs into: applying everywhere, hearing nothing back, and discovering too late that a job was never actually legal for someone his age.

Every other job platform was built with adults in mind. Indeed and LinkedIn have no idea how old an applicant is or what hours they are legally allowed to work. Snagajob locks out anyone under 16 entirely. The result is teens wasting time applying to jobs they cannot legally take, and employers wasting time sorting through applicants who do not qualify.

WorkTeen solves this with an eligibility engine. A teen enters their age, state, and zip code once, and every job listing is checked against that state's child labor laws (minimum hire age, school day versus non school day shift limits, latest allowed shift end time). Teens only ever see jobs they are actually eligible for.

## Launch scope

WorkTeen is launching hyper local, scoped to one town and a small radius around it, rather than as a global App Store product. Listings are real and manually confirmed through direct outreach to local businesses, not scraped or AI generated. As more confirmed listings come in, the geo gated area will expand.

## How the system is split

WorkTeen is two connected products sharing one backend.

### iOS app (teen facing)

The native app is where teens browse jobs, apply, track applications, and view local casual gigs. There is no posting functionality in the app. It is built in SwiftUI and includes:

* **Home** - personalized overview, eligibility summary, recommended jobs
* **Jobs** - full list of active job listings, filtered by eligibility, with ineligible jobs shown grayed out along with the reason rather than hidden entirely
* **Tasks** - read only view of approved casual gigs (lawn mowing, dog walking, babysitting, and similar), with poster contact info revealed only after a tap, and a report option on every listing
* **Applications** - a teen's own application history with status tracking
* **Profile** - age, state, zip, bio, availability, and an eventual first resume builder

### Website (poster and admin facing)

The website is where parents and individuals post casual gigs, and where the founder manages job listings and outreach. It is built in Next.js with Tailwind CSS and Framer Motion. It includes:

* **Landing page** - the public facing introduction to WorkTeen, with a real screen recording demo of the app and a scroll driven animated walkthrough of how the product works
* **/post-job** - public form for posting a casual task, which always starts in a pending review state
* **/admin** - password protected page for approving or rejecting pending gigs, and for manually adding real, outreach confirmed job listings
* **/leads** - password protected business finder tool using the free OpenStreetMap Overpass API, used only by the founder to identify local businesses for outreach

### Shared backend

Both the app and the website read and write to the same Firebase Firestore project, so a gig approved on the website appears immediately in the app, on any device, with no rebuild required.

## Why there is no automatic job scraping or AI generated hiring data

This is a deliberate design decision, not a missing feature.

WorkTeen exists specifically to solve the problem of unverified, stale, or legally inaccurate job listings. Pulling listings from Craigslist, guessing hiring status from a map database, or having an AI infer legal eligibility from a two sentence job description would recreate the exact problem this app is meant to fix.

Every formal job listing in WorkTeen is added manually, after a real conversation with a real employer. Every casual gig goes through a manual review step before it becomes visible to any teen. There is no feature anywhere in this app that fabricates or guesses whether a business is hiring.

## Tech stack

* **iOS app**: SwiftUI, Firebase Firestore, Core Location
* **Website**: Next.js, TypeScript, Tailwind CSS, Framer Motion, deployed on Vercel
* **Shared backend**: Firebase Firestore
* **Outreach tooling**: Claude Cowork for drafting and tracking employer outreach, OpenStreetMap Overpass API for business discovery

## Data models

**JobListing**
* title, employerName, category
* minimumAge, maxHoursSchoolDay, latestShiftEndSchoolNight
* payRate, description, datePosted, status (active or filled)

**PostedGig**
* title, description, category, payAmount, payType
* posterName, posterPhone, zip, preferredDate
* status (pending, approved, or rejected), datePosted, reported

**Application**
* jobId, teenId, status (applied, viewed, interview, hired, or not selected), appliedDate

**Teen**
* name, age, state, zip, bio, availability

## Eligibility engine

The eligibility engine compares a teen's age and state against a job listing's minimum age and stated hour restrictions. The current version checks minimum age directly, with the function signatures built so a full state by state child labor law lookup table can be added later without changing how any screen calls it.

```swift
struct EligibilityEngine {
    static func isEligible(teen: Teen, job: JobListing) -> Bool {
        return teen.age >= job.minimumAge
    }

    static func ineligibilityReason(teen: Teen, job: JobListing) -> String? {
        if teen.age < job.minimumAge {
            return "Minimum age for this role is \(job.minimumAge)"
        }
        return nil
    }
}
```

## Design system

WorkTeen uses a deep charcoal palette with a single gold accent, kept distinct from generic system colors.

* Background: #0F0F13
* Surface (cards, inputs): #1A1A24
* Border: #2A2A38
* Text primary: #F2EFE8
* Text secondary: #9B9AAF
* Gold accent (primary actions, pay rate): #F5A623
* Sage (eligible, approved, success states): #4CAF82
* Coral (rejected, destructive states only): #E8724A

## Safety and trust principles

* All hiring status and job eligibility data is manually verified, never inferred or scraped.
* All casual gig postings start in a pending state and require manual approval before any teen can see them.
* Every gig listing has a report option.
* Posters' phone numbers are hidden by default and only revealed after a deliberate tap.
* The app follows Apple App Store guideline 1.2 for user generated content, including report and terms of service requirements.

## Project structure

```
WorkTeen/
  ios/        Native SwiftUI app, teen facing
  web/        Next.js website, poster and admin facing
  README.md
```

## Getting started

### Website

1. Navigate to the web folder and install dependencies with npm install.
2. Create a free Firebase project with Firestore in Native mode (Spark free plan, no billing required), or use the existing project already connected to the iOS app.
3. Copy .env.local.example to .env.local and add your real Firebase config values and an admin password.
4. Run the development server with npm run dev and open localhost 3000.

### iOS app

1. Open the project in Xcode.
2. Add GoogleService-Info.plist from the same Firebase project used by the website.
3. Build and run on a simulator or device.

## Deployment

The website is deployed on Vercel with the project root directory set to web, and environment variables (Firebase config, admin password) set directly in Vercel's dashboard rather than committed to the repository.

The iOS app will be submitted to the App Store scoped to the initial launch area, with the rest of the country shown a waitlist state until coverage expands.

## Roadmap

* Replace the age only eligibility check with a full state by state child labor hour rules table
* Add a parent visibility or approval step for casual gig applicants under a certain age
* Build a self serve employer dashboard once there is consistent manual outreach demand for it
* Add a real first resume builder, unlocked after a teen's first confirmed hire
* Add the official Apple App Store badge and live link once the app is approved
* Expand the geo gated launch area as more confirmed listings come in

## Founder's note

WorkTeen started as one local teen calling and emailing nearby businesses, one at a time, asking a simple question: are you hiring, and would you take someone my age. Every real listing on this platform exists because that conversation happened. That is the whole point.
