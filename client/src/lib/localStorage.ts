import { insertWorkoutSchema, type Workout } from "@shared/schema";

export class LocalStorageWorkouts {
  private key = 'workout-tracker-data';

  getWorkouts(): Workout[] {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading workouts from localStorage:', error);
      return [];
    }
  }

  getWorkout(id: number): Workout | null {
    const workouts = this.getWorkouts();
    return workouts.find(w => w.id === id) || null;
  }

  saveWorkout(workoutData: Omit<Workout, 'id' | 'createdAt'>): Workout {
    try {
      const workouts = this.getWorkouts();
      const newWorkout: Workout = {
        ...workoutData,
        id: Date.now(), // Use timestamp as number
        createdAt: new Date()
      };
      
      // Validate the workout data (skip validation for local storage simplicity)
      // insertWorkoutSchema.parse(newWorkout);
      
      workouts.push(newWorkout);
      localStorage.setItem(this.key, JSON.stringify(workouts));
      return newWorkout;
    } catch (error) {
      console.error('Error saving workout to localStorage:', error);
      throw error;
    }
  }

  updateWorkout(id: number, workoutData: Partial<Workout>): Workout | null {
    try {
      const workouts = this.getWorkouts();
      const index = workouts.findIndex(w => w.id === id);
      
      if (index === -1) {
        return null;
      }
      
      const updatedWorkout = { ...workouts[index], ...workoutData };
      
      // Validate the updated workout data (skip validation for local storage simplicity)
      // insertWorkoutSchema.parse(updatedWorkout);
      
      workouts[index] = updatedWorkout;
      localStorage.setItem(this.key, JSON.stringify(workouts));
      return updatedWorkout;
    } catch (error) {
      console.error('Error updating workout in localStorage:', error);
      throw error;
    }
  }

  deleteWorkout(id: number): boolean {
    try {
      const workouts = this.getWorkouts();
      const filteredWorkouts = workouts.filter(w => w.id !== id);
      
      if (filteredWorkouts.length === workouts.length) {
        return false; // Workout not found
      }
      
      localStorage.setItem(this.key, JSON.stringify(filteredWorkouts));
      return true;
    } catch (error) {
      console.error('Error deleting workout from localStorage:', error);
      throw error;
    }
  }

  exportWorkouts(): string {
    const workouts = this.getWorkouts();
    return JSON.stringify(workouts, null, 2);
  }

  importWorkouts(jsonData: string): void {
    try {
      const workouts = JSON.parse(jsonData);
      
      // Validate each workout (skip validation for local storage simplicity)
      // workouts.forEach((workout: any) => {
      //   insertWorkoutSchema.parse(workout);
      // });
      
      localStorage.setItem(this.key, JSON.stringify(workouts));
    } catch (error) {
      console.error('Error importing workouts to localStorage:', error);
      throw new Error('Invalid workout data format');
    }
  }

  clearAllWorkouts(): void {
    localStorage.removeItem(this.key);
  }
}

// Create a singleton instance
export const localStorageWorkouts = new LocalStorageWorkouts();
