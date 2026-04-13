import {
  Plane,
  Train,
  Car,
  Bus,
  Ship,
  Footprints,
  Bike,
  TramFront,
  CarTaxiFront,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { TravelMode } from '@/types/trip-plan'

export interface TravelModeConfig {
  id: TravelMode
  label: string
  icon: LucideIcon
}

export const TRAVEL_MODES: Record<TravelMode, TravelModeConfig> = {
  plane: { id: 'plane', label: 'Plane', icon: Plane },
  train: { id: 'train', label: 'Train', icon: Train },
  car: { id: 'car', label: 'Car', icon: Car },
  bus: { id: 'bus', label: 'Bus', icon: Bus },
  ferry: { id: 'ferry', label: 'Ferry', icon: Ship },
  walk: { id: 'walk', label: 'Walk', icon: Footprints },
  bike: { id: 'bike', label: 'Bike', icon: Bike },
  subway: { id: 'subway', label: 'Subway', icon: TramFront },
  taxi: { id: 'taxi', label: 'Taxi', icon: CarTaxiFront },
  scooter: { id: 'scooter', label: 'Scooter', icon: Zap },
}

export const TRAVEL_MODE_LIST = Object.values(TRAVEL_MODES)
