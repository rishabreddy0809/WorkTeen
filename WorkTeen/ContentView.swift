//
//  ContentView.swift
//  WorkTeen
//
//  Root view: loads the teen profile on launch, shows the first-run setup form
//  if none exists, then renders the five-tab main experience.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var service = FirestoreService()
    @State private var activeTab: AppTab = .home
    @State private var teen: Teen? = nil
    @State private var isLoading = true

    // First-run setup form state
    @State private var setupName    = ""
    @State private var setupAge     = ""
    @State private var setupState   = "CA"
    @State private var setupZip     = ""
    @State private var setupError: String? = nil
    @State private var setupSaving  = false

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let coral   = Color(hex: "#E8724A")

    private let usStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
                            "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
                            "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
                            "VA","WA","WV","WI","WY","DC"]

    var body: some View {
        Group {
            if isLoading {
                // Splash / loading state
                ZStack {
                    bg.ignoresSafeArea()
                    VStack(spacing: 16) {
                        Text("WorkTeen")
                            .font(.largeTitle).fontWeight(.bold)
                            .foregroundColor(gold)
                        ProgressView().tint(gold)
                    }
                }
            } else if let currentTeen = teen {
                // Main app experience
                mainTabView(teen: currentTeen)
            } else {
                // First-run profile setup
                firstRunSetupView
            }
        }
        .task {
            await loadProfile()
        }
    }

    // MARK: - Main Tab View

    @ViewBuilder
    private func mainTabView(teen: Teen) -> some View {
        VStack(spacing: 0) {
            ZStack {
                switch activeTab {
                case .home:
                    HomeView(teen: teen, service: service)
                case .jobs:
                    JobsView(teen: teen, service: service)
                case .tasks:
                    TasksView(service: service)
                case .applications:
                    ApplicationsView(teen: teen, service: service)
                case .profile:
                    ProfileView(teen: teen, service: service)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            MorphingTabBar(activeTab: $activeTab)
        }
        .background(bg.ignoresSafeArea())
        .ignoresSafeArea(edges: .bottom)
    }

    // MARK: - First-Run Setup

    private var firstRunSetupView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome to WorkTeen")
                        .font(.title).fontWeight(.bold)
                        .foregroundColor(gold)
                    Text("Let's set up your profile so we can show you jobs you actually qualify for.")
                        .font(.subheadline)
                        .foregroundColor(textSec)
                }

                // Form fields
                VStack(alignment: .leading, spacing: 16) {
                    SetupField(label: "Your first name", placeholder: "e.g. Jordan", value: $setupName, textPri: textPri, textSec: textSec, border: border, gold: gold)

                    SetupField(label: "Your age", placeholder: "e.g. 16", value: $setupAge, keyboard: .numberPad, textPri: textPri, textSec: textSec, border: border, gold: gold)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("State").font(.caption).foregroundColor(textSec)
                        Picker("State", selection: $setupState) {
                            ForEach(usStates, id: \.self) { s in
                                Text(s).tag(s)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(gold)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(surface)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(border, lineWidth: 1))
                        .cornerRadius(8)
                    }

                    SetupField(label: "ZIP code", placeholder: "e.g. 90210", value: $setupZip, keyboard: .numberPad, textPri: textPri, textSec: textSec, border: border, gold: gold)
                }
                .padding(16)
                .background(surface)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
                .cornerRadius(12)

                if let err = setupError {
                    Text(err).font(.caption).foregroundColor(coral)
                }

                // Continue button
                Button {
                    Task { await createProfile() }
                } label: {
                    HStack {
                        Spacer()
                        if setupSaving {
                            ProgressView().tint(.black)
                        } else {
                            Text("Get started").fontWeight(.semibold)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(setupFormValid ? gold : gold.opacity(0.4))
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                .disabled(!setupFormValid || setupSaving)
            }
            .padding(24)
        }
        .background(bg.ignoresSafeArea())
    }

    private var setupFormValid: Bool {
        !setupName.trimmingCharacters(in: .whitespaces).isEmpty &&
        Int(setupAge) != nil &&
        !setupZip.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: - Helpers

    private func loadProfile() async {
        do {
            teen = try await service.loadTeenProfile()
        } catch {
            // If load fails, stay on first-run setup
            teen = nil
        }
        isLoading = false
    }

    private func createProfile() async {
        guard let ageInt = Int(setupAge) else { return }
        setupSaving = true
        setupError = nil
        let newTeen = Teen(
            id: UUID(),
            name: setupName.trimmingCharacters(in: .whitespaces),
            age: ageInt,
            state: setupState,
            zip: setupZip.trimmingCharacters(in: .whitespaces),
            bio: "",
            availability: []
        )
        do {
            try await service.saveTeenProfile(newTeen)
            teen = newTeen
        } catch {
            setupError = "Could not save profile: \(error.localizedDescription)"
        }
        setupSaving = false
    }
}

// MARK: - Setup Field

private struct SetupField: View {
    let label: String
    let placeholder: String
    @Binding var value: String
    var keyboard: UIKeyboardType = .default
    let textPri: Color
    let textSec: Color
    let border: Color
    let gold: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption).foregroundColor(textSec)
            TextField(placeholder, text: $value)
                .keyboardType(keyboard)
                .foregroundColor(textPri)
                .tint(gold)
                .padding(10)
                .background(Color(hex: "#0F0F13"))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(border, lineWidth: 1))
                .cornerRadius(8)
        }
    }
}

#Preview {
    ContentView()
}
