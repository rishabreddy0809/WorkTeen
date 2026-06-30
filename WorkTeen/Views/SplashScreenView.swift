//
//  SplashScreenView.swift
//  WorkTeen
//
//  Full-screen onboarding splash with animated fog blobs.
//

import SwiftUI

struct SplashScreenView: View {
    let gold: Color
    let coral: Color
    let onContinue: () -> Void

    // Fog animation phases — each blob drifts independently
    @State private var phase1: CGFloat = 0
    @State private var phase2: CGFloat = 0
    @State private var phase3: CGFloat = 0

    var body: some View {
        ZStack {
            // Base dark warm background
            Color(hex: "#0D0908").ignoresSafeArea()

            // Animated fog layer
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height
                ZStack {
                    // Blob 1 — warm amber, drifts up-right
                    Ellipse()
                        .fill(
                            RadialGradient(
                                colors: [Color(hex: "#9A6420").opacity(0.6), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.52
                            )
                        )
                        .frame(width: w * 1.1, height: w * 1.1)
                        .offset(
                            x: w * 0.2 + sin(phase1) * 30,
                            y: -h * 0.05 + cos(phase1 * 0.7) * 25
                        )

                    // Blob 2 — deep coral, drifts down-left
                    Ellipse()
                        .fill(
                            RadialGradient(
                                colors: [Color(hex: "#7A2E14").opacity(0.55), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.48
                            )
                        )
                        .frame(width: w * 1.0, height: w * 1.0)
                        .offset(
                            x: -w * 0.25 + cos(phase2) * 35,
                            y: h * 0.15 + sin(phase2 * 0.8) * 28
                        )

                    // Blob 3 — muted gold, drifts slowly center-bottom
                    Ellipse()
                        .fill(
                            RadialGradient(
                                colors: [Color(hex: "#B07418").opacity(0.4), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.44
                            )
                        )
                        .frame(width: w * 0.9, height: w * 0.9)
                        .offset(
                            x: sin(phase3 * 0.6) * 40,
                            y: h * 0.3 + cos(phase3) * 20
                        )
                }
                .frame(width: w, height: h)
            }
            .ignoresSafeArea()
            .blur(radius: 50)

            // Content — centered
            VStack(spacing: 0) {
                Spacer()

                // Tagline
                Text("BUILT BY A TEEN. FOR TEENS. FOR REAL.")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2.2)
                    .foregroundColor(Color(hex: "#C8A46A").opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 22)

                // Headline — large serif display, centered
                VStack(spacing: -2) {
                    Text("Real gigs.")
                        .font(.system(size: 56, weight: .black, design: .serif))
                        .foregroundColor(Color(hex: "#F0EBE2"))
                    Text("Real teens.")
                        .font(.system(size: 56, weight: .black, design: .serif))
                        .foregroundColor(Color(hex: "#F0EBE2"))
                    Text("Actually hired.")
                        .font(.system(size: 56, weight: .black, design: .serif))
                        .foregroundColor(gold)
                }
                .multilineTextAlignment(.center)
                .padding(.bottom, 30)

                // Subtitle
                Text("WorkTeen connects local teens with real\npaying gigs. No fluff, just work.")
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(Color(hex: "#8A7E6E"))
                    .multilineTextAlignment(.center)
                    .lineSpacing(5)
                    .padding(.bottom, 52)

                // CTA button
                Button(action: onContinue) {
                    HStack(spacing: 8) {
                        Text("Setup your account")
                            .font(.system(size: 17, weight: .semibold))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 17)
                    .background(
                        LinearGradient(
                            colors: [gold, coral],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 32)

                Spacer().frame(height: 52)
            }
            .padding(.horizontal, 32)
        }
        .onAppear {
            // Each blob animates on a slightly different period for organic drift
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                phase1 = .pi * 2
            }
            withAnimation(.linear(duration: 11).repeatForever(autoreverses: false)) {
                phase2 = .pi * 2
            }
            withAnimation(.linear(duration: 14).repeatForever(autoreverses: false)) {
                phase3 = .pi * 2
            }
        }
    }
}
