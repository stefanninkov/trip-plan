import { TripWizard } from '@/components/wizard/TripWizard'

export function NewTripPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">New trip</p>
        <h1>Plan your trip</h1>
      </div>
      <TripWizard />
    </div>
  )
}
