import { create } from 'zustand'
import type { Ride, CompanyEstimate, LocationPayload } from '@/types'

interface RideState {
  currentRide: Ride | null
  driverLocation: LocationPayload | null
  estimates: CompanyEstimate[]
  pickupAddress: string
  destinationAddress: string
  pickupCoords: [number, number] | null
  destinationCoords: [number, number] | null

  setCurrentRide: (ride: Ride | null) => void
  setDriverLocation: (loc: LocationPayload) => void
  setEstimates: (estimates: CompanyEstimate[]) => void
  setPickup: (address: string, coords: [number, number]) => void
  setDestination: (address: string, coords: [number, number]) => void
  clearRide: () => void
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  driverLocation: null,
  estimates: [],
  pickupAddress: '',
  destinationAddress: '',
  pickupCoords: null,
  destinationCoords: null,

  setCurrentRide: (ride) => set({ currentRide: ride }),
  setDriverLocation: (loc) => set({ driverLocation: loc }),
  setEstimates: (estimates) => set({ estimates }),
  setPickup: (address, coords) => set({ pickupAddress: address, pickupCoords: coords }),
  setDestination: (address, coords) => set({ destinationAddress: address, destinationCoords: coords }),
  clearRide: () => set({ currentRide: null, driverLocation: null, estimates: [] }),
}))
