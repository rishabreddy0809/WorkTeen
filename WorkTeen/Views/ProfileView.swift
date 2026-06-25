//
//  ProfileView.swift
//  WorkTeen
//
//  Editable teen profile. Saves to Firestore on tap. Includes a "Resume builder"
//  placeholder card that unlocks once the teen has a hired application.
//

import SwiftUI

struct ProfileView: View {
    @ObservedObject var service: FirestoreService

    // Editable copies of the teen's fields
    @State private var name: String
    @State private var age: String
    @State private var state: String
    @State private var zip: String
    @State private var bio: String
    @State private var selectedDays: Set<String>

    @State private var isSaving = false
    @State private var saveSuccess = false
    @State private var saveError: String? = nil

    // Whether the teen has been hired for any job (drives resume builder unlock)
    @State private var hasBeenHired = false

    private let allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    private let usStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
                            "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
                            "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
                            "VA","WA","WV","WI","WY","DC"]

    private let bg      = Color(hex: "#0F0F13")
    private let surface = Color(hex: "#1A1A24")
    private let border  = Color(hex: "#2A2A38")
    private let textPri = Color(hex: "#F2EFE8")
    private let textSec = Color(hex: "#9B9AAF")
    private let gold    = Color(hex: "#F5A623")
    private let sage    = Color(hex: "#4CAF82")
    private let coral   = Color(hex: "#E8724A")

    init(teen: Teen, service: FirestoreService) {
        _name         = State(initialValue: teen.name)
        _age          = State(initialValue: "\(teen.age)")
        _state        = State(initialValue: teen.state)
        _zip          = State(initialValue: teen.zip)
        _bio          = State(initialValue: teen.bio)
        _selectedDays = State(initialValue: Set(teen.availability))
        self.service  = service
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {

                    // Basic info
                    SectionCard(title: "Basic info", surface: surface, border: border, textPri: textPri) {
                        ProfileField(label: "Name", placeholder: "Your name", value: $name, textPri: textPri, textSec: textSec, border: border, gold: gold)
                        ProfileField(label: "Age", placeholder: "e.g. 16", value: $age, keyboard: .numberPad, textPri: textPri, textSec: textSec, border: border, gold: gold)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("State").font(.caption).foregroundColor(textSec)
                            Picker("State", selection: $state) {
                                ForEach(usStates, id: \.self) { s in
                                    Text(s).tag(s)
                                }
                            }
                            .pickerStyle(.menu)
                            .tint(gold)
                            .padding(10)
                            .background(Color(hex: "#0F0F13"))
                            .cornerRadius(8)
                        }

                        ProfileField(label: "ZIP code", placeholder: "e.g. 90210", value: $zip, keyboard: .numberPad, textPri: textPri, textSec: textSec, border: border, gold: gold)
                    }

                    // Bio
                    SectionCard(title: "Bio", surface: surface, border: border, textPri: textPri) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Tell employers about yourself")
                                .font(.caption)
                                .foregroundColor(textSec)
                            TextEditor(text: $bio)
                                .foregroundColor(textPri)
                                .scrollContentBackground(.hidden)
                                .background(Color.clear)
                                .frame(minHeight: 80)
                                .tint(gold)
                                .padding(8)
                                .background(Color(hex: "#0F0F13"))
                                .cornerRadius(8)
                        }
                    }

                    // Availability
                    SectionCard(title: "Availability", surface: surface, border: border, textPri: textPri) {
                        FlowLayout(spacing: 8) {
                            ForEach(allDays, id: \.self) { day in
                                let isOn = selectedDays.contains(day)
                                Button {
                                    if isOn { selectedDays.remove(day) }
                                    else { selectedDays.insert(day) }
                                } label: {
                                    Text(day)
                                        .font(.caption).fontWeight(isOn ? .semibold : .regular)
                                        .foregroundColor(isOn ? gold : textSec)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(isOn ? gold.opacity(0.15) : Color.clear)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(isOn ? gold : border, lineWidth: 1)
                                        )
                                        .cornerRadius(20)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    // Save feedback
                    if let err = saveError {
                        Text(err).font(.caption).foregroundColor(coral).padding(.horizontal)
                    }
                    if saveSuccess {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle.fill").foregroundColor(sage)
                            Text("Profile saved!").font(.caption).foregroundColor(sage)
                        }
                    }

                    // Save button
                    Button {
                        Task { await saveProfile() }
                    } label: {
                        HStack {
                            Spacer()
                            if isSaving {
                                ProgressView().tint(.black)
                            } else {
                                Text("Save Profile").fontWeight(.semibold)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .background(gold)
                        .foregroundColor(.black)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal)
                    .disabled(isSaving)

                    // Resume builder placeholder
                    ResumeBuilderCard(
                        isUnlocked: hasBeenHired,
                        surface: surface,
                        border: border,
                        textPri: textPri,
                        textSec: textSec,
                        gold: gold
                    )
                    .padding(.horizontal)

                    Spacer(minLength: 40)
                }
                .padding(.top, 16)
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .onAppear {
            // Check for a hired application to unlock resume builder
            service.listenToApplications(teenId: "") { apps in
                hasBeenHired = apps.contains { $0.status == "hired" }
            }
        }
    }

    private func saveProfile() async {
        isSaving = true
        saveError = nil
        saveSuccess = false
        let ageInt = Int(age) ?? 0
        let teen = Teen(
            id: UUID(), // will be overridden by the stored device ID in FirestoreService
            name: name,
            age: ageInt,
            state: state,
            zip: zip,
            bio: bio,
            availability: Array(selectedDays)
        )
        do {
            try await service.saveTeenProfile(teen)
            saveSuccess = true
        } catch {
            saveError = "Save failed: \(error.localizedDescription)"
        }
        isSaving = false
    }
}

// MARK: - Resume Builder Placeholder Card

private struct ResumeBuilderCard: View {
    let isUnlocked: Bool
    let surface: Color
    let border: Color
    let textPri: Color
    let textSec: Color
    let gold: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: isUnlocked ? "doc.richtext" : "lock.fill")
                    .font(.title2)
                    .foregroundColor(isUnlocked ? gold : textSec)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Resume Builder")
                        .font(.headline)
                        .foregroundColor(isUnlocked ? textPri : textSec)
                    Text(isUnlocked
                         ? "Build and export your resume."
                         : "Unlocked once you land your first job.")
                        .font(.caption)
                        .foregroundColor(textSec)
                }
                Spacer()
            }
        }
        .padding(16)
        .background(surface.opacity(isUnlocked ? 1.0 : 0.5))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border.opacity(isUnlocked ? 1.0 : 0.4), lineWidth: 1))
        .cornerRadius(12)
        .opacity(isUnlocked ? 1.0 : 0.6)
    }
}

// MARK: - Section Card wrapper

private struct SectionCard<Content: View>: View {
    let title: String
    let surface: Color
    let border: Color
    let textPri: Color
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(.headline)
                .foregroundColor(textPri)
            content
        }
        .padding(16)
        .background(surface)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Profile Field

private struct ProfileField: View {
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
