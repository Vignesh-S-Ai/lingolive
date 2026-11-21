import { Hero } from '../features/landing/hero'
import { LanguageStrip } from '../features/landing/language-strip'
import { Features } from '../features/landing/features'
import { HowItWorks } from '../features/landing/how-it-works'
import { FinalCta } from '../features/landing/final-cta'

export default function LandingPage() {
  return (
    <div className="relative">
      <Hero />
      <LanguageStrip />
      <Features />
      <HowItWorks />
      <FinalCta />
    </div>
  )
}
