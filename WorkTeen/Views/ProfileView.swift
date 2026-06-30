//
//  ProfileView.swift
//  WorkTeen
//

import SwiftUI

struct ProfileView: View {
    @ObservedObject var service: FirestoreService
    var onReset: (() -> Void)? = nil

    @State private var name: String
    @State private var age: String
    @State private var state: String
    @State private var zip: String
    @State private var bio: String
    @State private var selectedDays: Set<String>

    @State private var isSaving = false
    @State private var saveSuccess = false
    @State private var saveError: String? = nil
    @State private var hasBeenHired = false
    @State private var isEditingBio = false
    @State private var showResetConfirm = false
    @State private var isResetting = false

    private let allDays   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    private let fullDays  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    private let usStates  = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
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

    // Initials derived from the current name
    private var initials: String {
        name.split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
    }

    init(teen: Teen, service: FirestoreService, onReset: (() -> Void)? = nil) {
        _name         = State(initialValue: teen.name)
        _age          = State(initialValue: "\(teen.age)")
        _state        = State(initialValue: teen.state)
        _zip          = State(initialValue: teen.zip)
        _bio          = State(initialValue: teen.bio)
        _selectedDays = State(initialValue: Set(teen.availability))
        self.service  = service
        self.onReset  = onReset
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    heroHeader
                    VStack(spacing: 16) {
                        infoSection
                        bioSection
                        availabilitySection
                        resumeBuilderCard
                        saveSection
                        resetSection
                        Spacer(minLength: 110)
                    }
                    .padding(.top, 20)
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(bg, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .confirmationDialog("Reset everything?", isPresented: $showResetConfirm, titleVisibility: .visible) {
                Button("Reset & Start Over", role: .destructive) {
                    Task { await performReset() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will delete your profile and all your data. You'll be taken back to onboarding.")
            }
        }
        .onAppear {
            service.listenToApplications(teenId: "") { apps in
                hasBeenHired = apps.contains { $0.status == "hired" }
            }
        }
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        ZStack(alignment: .bottom) {
            // Gradient backdrop — extends into safe area so no clipping at top
            LinearGradient(
                colors: [gold.opacity(0.30), bg],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea(edges: .top)

            VStack(spacing: 12) {
                // Avatar circle
                ZStack {
                    // Outer glow ring
                    Circle()
                        .fill(gold.opacity(0.15))
                        .frame(width: 100, height: 100)
                        .blur(radius: 8)

                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [gold, Color(hex: "#E8724A")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 84, height: 84)
                        .shadow(color: gold.opacity(0.5), radius: 16, x: 0, y: 6)

                    Text(initials.isEmpty ? "?" : initials)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.black)
                }

                // Name
                Text(name.isEmpty ? "Your Name" : name)
                    .font(.title2).fontWeight(.bold)
                    .foregroundColor(textPri)

                // Stat chips
                HStack(spacing: 8) {
                    StatChip(icon: "birthday.cake", label: "\(age) yrs", gold: gold, surface: surface, textSec: textSec)
                    StatChip(icon: "map", label: state.isEmpty ? "State" : state, gold: gold, surface: surface, textSec: textSec)
                    StatChip(icon: "location", label: zip.isEmpty ? "ZIP" : zip, gold: gold, surface: surface, textSec: textSec)
                }
            }
            .padding(.top, 60)
            .padding(.bottom, 28)
        }
    }

    // MARK: - Info Section

    private var infoSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionHeader("Personal Info", icon: "person.fill")

            VStack(spacing: 1) {
                InlineField(label: "Name", placeholder: "Your full name", value: $name,
                            textPri: textPri, textSec: textSec, gold: gold, surface: surface, border: border)
                Divider().background(border).padding(.leading, 16)
                InlineField(label: "Age", placeholder: "e.g. 16", value: $age, keyboard: .numberPad,
                            textPri: textPri, textSec: textSec, gold: gold, surface: surface, border: border)
                Divider().background(border).padding(.leading, 16)
                // State picker row
                HStack {
                    Text("State")
                        .font(.subheadline)
                        .foregroundColor(textSec)
                        .frame(width: 80, alignment: .leading)
                    Picker("State", selection: $state) {
                        ForEach(usStates, id: \.self) { s in Text(s).tag(s) }
                    }
                    .pickerStyle(.menu)
                    .tint(textPri)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(surface)
                Divider().background(border).padding(.leading, 16)
                InlineField(label: "ZIP", placeholder: "e.g. 90210", value: $zip, keyboard: .numberPad,
                            textPri: textPri, textSec: textSec, gold: gold, surface: surface, border: border)
            }
            .background(surface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(border, lineWidth: 1))
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Bio Section

    private var bioSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionHeader("About Me", icon: "text.alignleft")

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: "quote.opening")
                        .font(.caption).foregroundColor(gold.opacity(0.6))
                    Text("Tell employers what makes you a great hire")
                        .font(.caption)
                        .foregroundColor(textSec)
                }

                TextEditor(text: $bio)
                    .foregroundColor(textPri)
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .frame(minHeight: 100, maxHeight: 160)
                    .tint(gold)

                HStack {
                    // Gold underline bar proportional to char count (max 300)
                    GeometryReader { geo in
                        Capsule()
                            .fill(gold.opacity(0.3))
                            .frame(width: geo.size.width)
                        Capsule()
                            .fill(gold)
                            .frame(width: geo.size.width * min(CGFloat(bio.count) / 300, 1))
                    }
                    .frame(height: 2)
                    Spacer(minLength: 8)
                    Text("\(bio.count)/300")
                        .font(.caption2)
                        .foregroundColor(textSec.opacity(0.5))
                }
            }
            .padding(16)
            .background(surface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(border, lineWidth: 1)
            )
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Availability Section

    private var availabilitySection: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionHeader("Availability", icon: "calendar")

            VStack(spacing: 12) {
                // 7-day pill row
                HStack(spacing: 6) {
                    ForEach(Array(Swift.zip(allDays, fullDays)), id: \.0) { short, full in
                        let isOn = selectedDays.contains(full)
                        Button {
                            if isOn { selectedDays.remove(full) }
                            else     { selectedDays.insert(full) }
                        } label: {
                            Text(short)
                                .font(.caption).fontWeight(.semibold)
                                .foregroundColor(isOn ? .black : textSec)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(isOn ? gold : bg)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(isOn ? gold : border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !selectedDays.isEmpty {
                    Text(selectedDays.sorted().joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(textSec)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(16)
            .background(surface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(border, lineWidth: 1))
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Resume Builder Card

    private var resumeBuilderCard: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(hasBeenHired
                          ? LinearGradient(colors: [gold, Color(hex: "#E8724A")], startPoint: .topLeading, endPoint: .bottomTrailing)
                          : LinearGradient(colors: [surface, surface], startPoint: .top, endPoint: .bottom))
                    .frame(width: 48, height: 48)
                Image(systemName: hasBeenHired ? "doc.richtext.fill" : "lock.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(hasBeenHired ? .black : textSec)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Resume Builder")
                    .font(.subheadline).fontWeight(.bold)
                    .foregroundColor(hasBeenHired ? textPri : textSec)
                Text(hasBeenHired
                     ? "Build and export your resume."
                     : "Land your first job to unlock this.")
                    .font(.caption)
                    .foregroundColor(textSec)
            }

            Spacer()

            if hasBeenHired {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(textSec.opacity(0.5))
            } else {
                Text("Locked")
                    .font(.caption2).fontWeight(.semibold)
                    .foregroundColor(textSec)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(border)
                    .clipShape(Capsule())
            }
        }
        .padding(16)
        .background(surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(hasBeenHired ? gold.opacity(0.4) : border, lineWidth: 1))
        .padding(.horizontal, 16)
        .opacity(hasBeenHired ? 1 : 0.6)
    }

    // MARK: - Save Section

    private var saveSection: some View {
        VStack(spacing: 10) {
            if let err = saveError {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.circle.fill").foregroundColor(coral)
                    Text(err).font(.caption).foregroundColor(coral)
                }
                .padding(.horizontal)
            }

            if saveSuccess {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill").foregroundColor(sage)
                    Text("Profile saved!").font(.caption).foregroundColor(sage)
                }
            }

            Button {
                Task { await saveProfile() }
            } label: {
                HStack {
                    Spacer()
                    if isSaving {
                        ProgressView().tint(.black)
                    } else {
                        Image(systemName: "checkmark")
                            .font(.subheadline).fontWeight(.bold)
                        Text("Save Profile")
                            .font(.subheadline).fontWeight(.bold)
                    }
                    Spacer()
                }
                .padding(16)
                .background(
                    LinearGradient(colors: [gold, Color(hex: "#E8724A")],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .foregroundColor(.black)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)
            .disabled(isSaving)
        }
    }

    // MARK: - Helpers

    // MARK: - Reset Section

    private var resetSection: some View {
        VStack(spacing: 8) {
            Divider()
                .background(Color(hex: "#2A2A38"))
                .padding(.horizontal, 16)
                .padding(.top, 8)

            Button {
                showResetConfirm = true
            } label: {
                HStack(spacing: 8) {
                    if isResetting {
                        ProgressView().tint(coral)
                    } else {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.subheadline)
                        Text("Reset Everything")
                            .font(.subheadline).fontWeight(.medium)
                    }
                }
                .foregroundColor(coral)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(coral.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(coral.opacity(0.25), lineWidth: 1))
            }
            .buttonStyle(.plain)
            .disabled(isResetting)
            .padding(.horizontal, 16)

            Text("Clears your profile and returns to onboarding.")
                .font(.caption2)
                .foregroundColor(textSec.opacity(0.5))
                .multilineTextAlignment(.center)
                .padding(.bottom, 4)
        }
    }

    private func performReset() async {
        isResetting = true
        try? await service.deleteTeenProfile()
        isResetting = false
        onReset?()
    }

    private func sectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption).fontWeight(.semibold)
                .foregroundColor(gold)
            Text(title)
                .font(.caption).fontWeight(.semibold)
                .foregroundColor(textSec)
                .textCase(.uppercase)
                .tracking(0.8)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private func saveProfile() async {
        isSaving = true
        saveError = nil
        saveSuccess = false
        let teen = Teen(
            id: UUID(),
            name: name,
            age: Int(age) ?? 0,
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

// MARK: - Stat Chip

private struct StatChip: View {
    let icon: String
    let label: String
    let gold: Color
    let surface: Color
    let textSec: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundColor(gold)
            Text(label)
                .font(.caption).fontWeight(.medium)
                .foregroundColor(textSec)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(surface)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color(hex: "#2A2A38"), lineWidth: 1))
    }
}

// MARK: - Inline Field

private struct InlineField: View {
    let label: String
    let placeholder: String
    @Binding var value: String
    var keyboard: UIKeyboardType = .default
    let textPri: Color
    let textSec: Color
    let gold: Color
    let surface: Color
    let border: Color

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(textSec)
                .frame(width: 80, alignment: .leading)
            TextField(placeholder, text: $value)
                .keyboardType(keyboard)
                .font(.subheadline)
                .foregroundColor(textPri)
                .tint(gold)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(surface)
    }
}
