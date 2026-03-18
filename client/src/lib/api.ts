import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStorageWorkouts } from './localStorage';
import { type Workout, type InsertWorkout } from '@shared/schema';

// Simulate async operations to match the original API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      await delay(100); // Simulate network delay
      return localStorageWorkouts.getWorkouts();
    },
  });
}

export function useWorkout(id: number) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: async () => {
      await delay(50);
      return localStorageWorkouts.getWorkout(id);
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (workoutData: InsertWorkout) => {
      await delay(200); // Simulate network delay
      // Convert undefined values to null to match database schema
      const dbWorkoutData = {
        ...workoutData,
        choIntake: workoutData.choIntake ?? null,
        normalizedPower: workoutData.normalizedPower ?? null,
        variabilityIndex: workoutData.variabilityIndex ?? null,
        avgHeartRate: workoutData.avgHeartRate ?? null,
        hrv: workoutData.hrv ?? null,
        trainerRoadRpe: workoutData.trainerRoadRpe ?? null,
        trainerRoadLgt: workoutData.trainerRoadLgt ?? null,
        whatWentWell: workoutData.whatWentWell ?? null,
        whatCouldBeImproved: workoutData.whatCouldBeImproved ?? null,
      };
      return localStorageWorkouts.saveWorkout(dbWorkoutData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Workout> }) => {
      await delay(200);
      const result = localStorageWorkouts.updateWorkout(id, data);
      if (!result) {
        throw new Error('Workout not found');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', data.id] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await delay(200);
      const success = localStorageWorkouts.deleteWorkout(id);
      if (!success) {
        throw new Error('Workout not found');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.setQueryData(['workouts', deletedId], null);
    },
  });
}

// Utility functions for data management
export function useExportWorkouts() {
  return useMutation({
    mutationFn: async () => {
      await delay(100);
      return localStorageWorkouts.exportWorkouts();
    },
  });
}

export function useImportWorkouts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jsonData: string) => {
      await delay(300);
      localStorageWorkouts.importWorkouts(jsonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useClearAllWorkouts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await delay(200);
      localStorageWorkouts.clearAllWorkouts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
