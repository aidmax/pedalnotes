import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema, type InsertWorkout, type EntryType } from "@shared/schema-static";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { useSectionState, type SectionId } from "@/hooks/use-section-state";
import {
  Zap,
  Copy,
  Download,
  Target,
  Activity,
  Heart,
  Gauge,
  TrendingUp,
  Cpu,
  Cookie,
  BarChart3,
  Smile,
  Calendar,
  Info,
  Sun,
  Moon,
  RotateCcw,
  Bike,
  BedDouble,
  Dumbbell,
  ClipboardList,
  Scale,
  NotebookPen
} from "lucide-react";

const SECTION_DEFAULTS: Record<SectionId, boolean> = {
  "core-metrics": true,
  "fueling": false,
  "performance-metrics": false,
  "recovery-metrics": false,
  "reflection": true,
  "rest-day": true,
  "activity": true,
};

const FIELD_TO_SECTION: Partial<Record<keyof InsertWorkout, SectionId>> = {
  goal: "core-metrics",
  rpe: "core-metrics",
  feel: "core-metrics",
  trainerRoadRpe: "core-metrics",
  choIntakePre: "fueling",
  choIntake: "fueling",
  choIntakePost: "fueling",
  normalizedPower: "performance-metrics",
  tss: "performance-metrics",
  avgHeartRate: "performance-metrics",
  hrv: "recovery-metrics",
  rMSSD: "recovery-metrics",
  rhr: "recovery-metrics",
  trainerRoadLgt: "recovery-metrics",
  whatWentWell: "reflection",
  whatCouldBeImproved: "reflection",
  description: "reflection",
  weight: "rest-day",
  restNotes: "rest-day",
  activityGoal: "activity",
  activityNotes: "activity",
};

const entryTypeOptions = [
  { value: "cycling" as const, label: "Cycling", icon: Bike },
  { value: "rest" as const, label: "Rest", icon: BedDouble },
  { value: "other" as const, label: "Other", icon: Dumbbell },
];

const entryTypeSubtitles: Record<EntryType, string> = {
  cycling: "Fill in your cycling workout information to generate a structured markdown report.",
  rest: "Log your rest day — wellness metrics and how you're feeling.",
  other: "Log your activity — stretching, yoga, strength, mobility, or anything else.",
};

const VISIBLE_SECTIONS_BY_TYPE: Record<EntryType, SectionId[]> = {
  cycling: ["core-metrics", "fueling", "performance-metrics", "recovery-metrics", "reflection"],
  rest: ["recovery-metrics", "rest-day"],
  other: ["activity"],
};

const rpeOptions = [
  { value: "1", label: "1 - Nothing at all" },
  { value: "2", label: "2 - Extremely light" },
  { value: "3", label: "3 - Very light" },
  { value: "4", label: "4 - Light" },
  { value: "5", label: "5 - Moderate" },
  { value: "6", label: "6 - Somewhat hard" },
  { value: "7", label: "7 - Hard" },
  { value: "8", label: "8 - Very hard" },
  { value: "9", label: "9 - Extremely hard" },
  { value: "10", label: "10 - Max effort" }
];

const feelOptions = [
  { value: "W", label: "Weak (W)" },
  { value: "P", label: "Poor (P)" },
  { value: "N", label: "Normal (N)" },
  { value: "G", label: "Good (G)" },
  { value: "S", label: "Strong (S)" }
];

const trRpeDescriptions: { [key: number]: string } = {
  1: "This ride felt easy and non-taxing, requiring little effort or focus. You could repeat the ride and pass it without issue.",
  2: "This ride was somewhat comfortable but required some focus to complete. You felt a little challenged but had confidence that you could finish. If the ride had an additional set of intervals, you could complete it.",
  3: "This ride required effort and focus and was challenging to complete. This will feel tough and you'll look forward to this ride ending. If there was an additional interval, you could have done it with some focus.",
  4: "This ride was very difficult to complete. This ride tested you. If there would have been one more interval, you wouldn't have been able to do it.",
  5: "This ride was extremely difficult. It pushed me well beyond my abilities and took a massive amount of energy and focus to complete. You'll feel like you barely made it to the end of this ride, and that you had to pull out every mental trick in the book to finish."
};

const lgtOptions = [
  { value: "G", label: "Green (G) - All systems go" },
  { value: "Y", label: "Yellow (Y) - Caution advised" },
  { value: "R", label: "Red (R) - Recovery needed" }
];

function getDefaultWorkoutValues(): InsertWorkout {
  return {
    entryType: "cycling",
    workoutDate: new Date().toISOString().split('T')[0],
    goal: "",
    rpe: 5,
    feel: "N",
    choIntakePre: "",
    choIntake: "",
    choIntakePost: "",
    normalizedPower: undefined,
    tss: undefined,
    avgHeartRate: undefined,
    hrv: "",
    rMSSD: undefined,
    rhr: undefined,
    trainerRoadRpe: undefined,
    trainerRoadLgt: undefined,
    whatWentWell: "",
    whatCouldBeImproved: "",
    description: "",
    weight: undefined,
    restNotes: "",
    activityGoal: "",
    activityNotes: "",
  };
}

function formatBulletPoints(text: string): string {
  if (!text) return "";

  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .flatMap((rawLine) => {
      if (!rawLine.trim()) return [];

      const hasExplicitListMarker = /^\s*[\u2022*+-]\s+/.test(rawLine);
      const leadingWhitespace = hasExplicitListMarker ? (rawLine.match(/^\s*/)?.[0] ?? "") : "";
      const trimmedLine = rawLine.trim();

      const segments = trimmedLine.includes("\u2022")
        ? trimmedLine.split(/\s*\u2022\s*/).map((segment) => segment.trim()).filter(Boolean)
        : [trimmedLine];

      return segments.map((segment) => {
        const markdownMarkerMatch = segment.match(/^[-*+]\s+(.*)$/);
        const content = markdownMarkerMatch ? markdownMarkerMatch[1] : segment;
        return `${leadingWhitespace}- ${content}`;
      });
    })
    .join("\n");
}

function formatWorkoutDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function generateCyclingMarkdown(data: InsertWorkout): string {
  let markdown = "";

  if (data.goal) markdown += `G: ${data.goal}\n`;
  markdown += `R: ${data.rpe}\n`;
  markdown += `F: ${data.feel}\n`;

  if (data.choIntakePre) markdown += `Ci-Pre: ${data.choIntakePre}\n`;
  if (data.choIntake) markdown += `Ci: ${data.choIntake}\n`;
  if (data.choIntakePost) markdown += `Ci-Post: ${data.choIntakePost}\n`;
  if (data.normalizedPower) markdown += `NP: ${data.normalizedPower}\n`;
  if (data.tss) markdown += `TSS: ${data.tss}\n`;
  if (data.avgHeartRate) markdown += `Hr: ${data.avgHeartRate}\n`;
  if (data.trainerRoadRpe) markdown += `TR-RPE: ${data.trainerRoadRpe}\n`;
  if (data.hrv) markdown += `HRV: ${data.hrv}\n`;
  if (data.rMSSD) markdown += `rMSSD: ${data.rMSSD}\n`;
  if (data.rhr) markdown += `RHR: ${data.rhr}\n`;
  if (data.trainerRoadLgt && data.trainerRoadLgt !== 'G') {
    markdown += `TR-LGT: ${data.trainerRoadLgt}\n`;
  }

  markdown += '\n';

  if (data.whatWentWell) {
    markdown += 'WWW\n';
    markdown += formatBulletPoints(data.whatWentWell) + '\n\n';
  }

  if (data.whatCouldBeImproved) {
    markdown += 'WCBI\n';
    markdown += formatBulletPoints(data.whatCouldBeImproved) + '\n';
  }

  if (data.description) {
    markdown += '\nPlanned\n';
    markdown += data.description + '\n';
  }

  return markdown;
}

function generateRestMarkdown(data: InsertWorkout): string {
  let markdown = "Rest Day\n\n";

  if (data.hrv) markdown += `HRV: ${data.hrv}\n`;
  if (data.rMSSD) markdown += `rMSSD: ${data.rMSSD}\n`;
  if (data.rhr) markdown += `RHR: ${data.rhr}\n`;
  if (data.trainerRoadLgt && data.trainerRoadLgt !== 'G') {
    markdown += `TR-LGT: ${data.trainerRoadLgt}\n`;
  }
  if (data.weight) markdown += `Weight: ${data.weight}\n`;

  if (data.restNotes) {
    markdown += '\n' + formatBulletPoints(data.restNotes) + '\n';
  }

  return markdown;
}

function generateOtherMarkdown(data: InsertWorkout): string {
  let markdown = "";

  if (data.activityGoal) markdown += `G: ${data.activityGoal}\n`;

  if (data.activityNotes) {
    markdown += '\n' + formatBulletPoints(data.activityNotes) + '\n';
  }

  return markdown;
}

function generateMarkdown(data: InsertWorkout): string {
  let markdown = `---\n## ${formatWorkoutDate(data.workoutDate)}\n\n`;

  switch (data.entryType) {
    case "rest":
      markdown += generateRestMarkdown(data);
      break;
    case "other":
      markdown += generateOtherMarkdown(data);
      break;
    case "cycling":
    default:
      markdown += generateCyclingMarkdown(data);
      break;
  }

  return markdown;
}

export default function Home() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [markdownOutput, setMarkdownOutput] = useState("");
  
  const form = useForm<InsertWorkout>({
    resolver: zodResolver(insertWorkoutSchema),
    defaultValues: getDefaultWorkoutValues()
  });

  const { wasRestored, clearDraft } = useFormPersistence(form, {
    key: "pedalnotes-draft",
  });

  const { sectionStates, toggleSection, setSection } = useSectionState({
    key: "pedalnotes-sections",
    defaults: SECTION_DEFAULTS,
  });

  const isQuickMode = useMemo(
    () => new URLSearchParams(window.location.search).get('quick') === '1',
    []
  );

  const watchedValues = form.watch();
  const entryType: EntryType = watchedValues.entryType ?? "cycling";

  const { isDirty } = form.formState;

  const visibleSectionIds = VISIBLE_SECTIONS_BY_TYPE[entryType];
  const allExpanded = visibleSectionIds.every((id) => sectionStates[id]);

  function expandAllOrCollapseAll() {
    const target = !allExpanded;
    visibleSectionIds.forEach((id) => setSection(id, target));
  }

  const prevEntryTypeRef = useRef<EntryType>(entryType);
  useEffect(() => {
    const prev = prevEntryTypeRef.current;
    if (prev !== entryType && entryType === "rest") {
      setSection("recovery-metrics", true);
    }
    prevEntryTypeRef.current = entryType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryType]);

  function autoExpandErrorSections() {
    const errors = form.formState.errors;
    for (const [field, sectionId] of Object.entries(FIELD_TO_SECTION)) {
      if (errors[field as keyof InsertWorkout]) {
        setSection(sectionId!, true);
      }
    }
  }

  useEffect(() => {
    setMarkdownOutput((isDirty || wasRestored || isQuickMode) ? generateMarkdown(watchedValues) : "");
  }, [watchedValues, isDirty, wasRestored, isQuickMode]);

  useEffect(() => {
    if (wasRestored) {
      toast({
        title: "Draft restored",
        description: "Your previous workout entry was recovered.",
      });
    }
  }, [wasRestored]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyToClipboard = async () => {
    if (!isQuickMode) {
      await form.trigger();
      autoExpandErrorSections();
    }
    const exportMarkdown = generateMarkdown(form.getValues());
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportMarkdown);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = exportMarkdown;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }
      
      toast({
        title: "Copied to clipboard",
        description: "Markdown has been copied to your clipboard."
      });
    } catch (err) {
      console.error('Copy failed:', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  const handleClearForm = () => {
    form.reset(getDefaultWorkoutValues());
    clearDraft();
    toast({ title: "Form cleared" });
  };

  const handleDownload = async () => {
    if (!isQuickMode) {
      await form.trigger();
      autoExpandErrorSections();
    }
    const exportMarkdown = generateMarkdown(form.getValues());
    const blob = new Blob([exportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-${form.getValues('workoutDate')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your markdown file is being downloaded."
    });
  };

  if (isQuickMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">PedalNotes</h1>
                <span className="hidden sm:inline text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">Quick Entry</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={window.location.pathname}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Full form
                </a>
                <button
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Quick Entry</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Log the essentials now — open the{" "}
                  <a href={window.location.pathname} className="text-blue-500 hover:underline">full form</a>
                  {" "}to add more details later.
                </p>
              </div>

              <Form {...form}>
                <form className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="workoutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Workout Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rpe"
                    render={({ field }) => {
                      const rpeDescriptions: { [key: number]: string } = {
                        1: 'Nothing at all', 2: 'Very easy', 3: 'Easy', 4: 'Comfortable',
                        5: 'Slightly challenging', 6: 'Difficult', 7: 'Hard',
                        8: 'Very hard', 9: 'Extremely hard', 10: 'Max effort'
                      };
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-500" />
                            R (RPE): {field.value ?? 5}/10
                          </FormLabel>
                          <FormControl>
                            <div className="px-2 py-4">
                              <Slider
                                value={[field.value ?? 5]}
                                onValueChange={(value) => field.onChange(value[0])}
                                max={10} min={1} step={1} className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>1 - Nothing at all</span>
                                {field.value !== undefined && field.value >= 2 && field.value <= 9 && <span>{rpeDescriptions[field.value]}</span>}
                                <span>10 - Max effort</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="feel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Smile className="w-4 h-4 text-green-500" />
                          F (Feel): {feelOptions.find(opt => opt.value === field.value)?.label || 'Normal (N)'}
                        </FormLabel>
                        <FormControl>
                          <div className="px-2 py-4">
                            <Slider
                              value={[feelOptions.findIndex(opt => opt.value === field.value) + 1]}
                              onValueChange={(value) => field.onChange(feelOptions[value[0] - 1]?.value || 'N')}
                              max={5} min={1} step={1} className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Weak</span><span>Poor</span><span>Normal</span><span>Good</span><span>Strong</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatWentWell"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WWW (What Went Well)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="• Enter each point on a new line&#10;• Focus on positive aspects of the workout"
                            className="resize-y"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatCouldBeImproved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WCBI (What Could Be Improved)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="• Enter each improvement area on a new line&#10;• Be specific about what could be better"
                            className="resize-y"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Button type="button" className="flex-1 bg-brand-blue hover:bg-blue-700 text-white" onClick={handleCopyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button type="button" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button type="button" variant="outline" className="sm:flex-none" onClick={handleClearForm}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {markdownOutput && (
            <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Preview</h2>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Live</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-56 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                    {markdownOutput}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">PedalNotes</h1>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
              Privacy-first training journal for cyclists
            </div>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          
          {/* Form Section */}
          <div className="xl:col-span-3">
            <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Workout Details</h2>
                    <button
                      type="button"
                      onClick={expandAllOrCollapseAll}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {allExpanded ? "Collapse all" : "Expand all"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{entryTypeSubtitles[entryType]}</p>
                </div>

                <Form {...form}>
                  <form className="space-y-6">
                    {/* Date Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <FormField
                        control={form.control}
                        name="workoutDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Workout Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Entry Type Selector */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-3">
                        <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Entry Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {entryTypeOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = entryType === option.value;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={isActive ? "default" : "outline"}
                              className={isActive ? "bg-brand-blue hover:bg-blue-700 text-white" : ""}
                              onClick={() => form.setValue("entryType", option.value, { shouldDirty: true })}
                            >
                              <Icon className="w-4 h-4 mr-1.5" />
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Core Metrics Section — Cycling only */}
                    {entryType === "cycling" && (
                    <CollapsibleSection
                      id="core-metrics"
                      title="Core Metrics"
                      isOpen={sectionStates["core-metrics"]}
                      onOpenChange={(open) => setSection("core-metrics", open)}
                      hasData={
                        !!watchedValues.goal ||
                        watchedValues.rpe !== 5 ||
                        watchedValues.feel !== "N" ||
                        watchedValues.trainerRoadRpe !== undefined
                      }
                    >
                      <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              G (Goal)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Describe your workout objective..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rpe"
                        render={({ field }) => {
                          const rpeDescriptions: { [key: number]: string } = {
                            1: 'Nothing at all',
                            2: 'Very easy',
                            3: 'Easy',
                            4: 'Comfortable',
                            5: 'Slightly challenging',
                            6: 'Difficult',
                            7: 'Hard',
                            8: 'Very hard',
                            9: 'Extremely hard',
                            10: 'Max effort'
                          };
                          
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-orange-500" />
                                R (RPE - Rate of Perceived Exertion): {field.value ?? 5}/10
                              </FormLabel>
                              <FormControl>
                                <div className="px-2 py-4">
                                  <Slider
                                    value={[field.value ?? 5]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    max={10}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>1 - Nothing at all</span>
                                    {field.value !== undefined && field.value >= 2 && field.value <= 9 && (
                                      <span>
                                        {rpeDescriptions[field.value]}
                                      </span>
                                    )}
                                    <span>10 - Max effort</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="trainerRoadRpe"
                        render={({ field }) => {
                          const trRpeOptions = [1, 2, 3, 4, 5];
                          const trRpeLabels = ['Easy', 'Moderate', 'Hard', 'Very hard', 'Maximum effort'];
                          const currentIndex = field.value ? trRpeOptions.indexOf(field.value) : -1;
                          const currentLabel = currentIndex >= 0 ? `${field.value} - ${trRpeLabels[currentIndex]}` : 'Not set';
                          
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-500" />
                                TR-RPE (TrainerRoad RPE): {currentLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="px-2 py-4">
                                  <Slider
                                    value={[currentIndex + 1]}
                                    onValueChange={(value) => {
                                      const newIndex = value[0] - 1;
                                      field.onChange(newIndex >= 0 ? trRpeOptions[newIndex] : undefined);
                                    }}
                                    max={5}
                                    min={0}
                                    step={1}
                                    className="w-full"
                                  />
                                  <TooltipProvider>
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                      <span>Not set</span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">1-Easy</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{trRpeDescriptions[1]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">2-Moderate</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{trRpeDescriptions[2]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">3-Hard</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{trRpeDescriptions[3]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">4-Very hard</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{trRpeDescriptions[4]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">5-Maximum</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{trRpeDescriptions[5]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TooltipProvider>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="feel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Smile className="w-4 h-4 text-green-500" />
                              F (Feel): {feelOptions.find(opt => opt.value === field.value)?.label || 'Normal (N)'}
                            </FormLabel>
                            <FormControl>
                              <div className="px-2 py-4">
                                <Slider
                                  value={[feelOptions.findIndex(opt => opt.value === field.value) + 1]}
                                  onValueChange={(value) => field.onChange(feelOptions[value[0] - 1]?.value || 'N')}
                                  max={5}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                  <span>Weak</span>
                                  <span>Poor</span>
                                  <span>Normal</span>
                                  <span>Good</span>
                                  <span>Strong</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </CollapsibleSection>
                    )}

                    {/* Fueling Section — Cycling only */}
                    {entryType === "cycling" && (
                    <CollapsibleSection
                      id="fueling"
                      title="Fueling"
                      isOpen={sectionStates["fueling"]}
                      onOpenChange={(open) => setSection("fueling", open)}
                      hasData={
                        !!watchedValues.choIntakePre ||
                        !!watchedValues.choIntake ||
                        !!watchedValues.choIntakePost
                      }
                    >
                      <FormField
                        control={form.control}
                        name="choIntakePre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Cookie className="w-4 h-4 text-yellow-500" />
                              Ci-Pre (Carbohydrate Intake Before Workout)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., oatmeal, banana, energy bar..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="choIntake"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Cookie className="w-4 h-4 text-yellow-500" />
                              Ci (Carbohydrate Intake During Ride)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2 gels, 1 banana, sports drink..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="choIntakePost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Cookie className="w-4 h-4 text-yellow-500" />
                              Ci-Post (Carbohydrate Intake After Workout)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., protein shake, rice, recovery drink..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleSection>
                    )}

                    {/* Performance Metrics Section — Cycling only */}
                    {entryType === "cycling" && (
                    <CollapsibleSection
                      id="performance-metrics"
                      title="Performance Metrics"
                      isOpen={sectionStates["performance-metrics"]}
                      onOpenChange={(open) => setSection("performance-metrics", open)}
                      hasData={
                        watchedValues.normalizedPower !== undefined ||
                        watchedValues.tss !== undefined ||
                        watchedValues.avgHeartRate !== undefined
                      }
                    >

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="normalizedPower"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-600" />
                                NP (Normalized Power)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Watts" 
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />


                        <FormField
                          control={form.control}
                          name="tss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-orange-500" />
                                TSS (Training Stress Score)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Score" 
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="avgHeartRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                Hr (Average Heart Rate)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="BPM" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CollapsibleSection>
                    )}

                    {/* Recovery Metrics Section — Cycling + Rest */}
                    {(entryType === "cycling" || entryType === "rest") && (
                    <CollapsibleSection
                      id="recovery-metrics"
                      title="Recovery Metrics"
                      isOpen={sectionStates["recovery-metrics"]}
                      onOpenChange={(open) => setSection("recovery-metrics", open)}
                      hasData={
                        !!watchedValues.hrv ||
                        watchedValues.rMSSD !== undefined ||
                        watchedValues.rhr !== undefined ||
                        (!!watchedValues.trainerRoadLgt && watchedValues.trainerRoadLgt !== "G")
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hrv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-cyan-500" />
                                HRV (HRV4Training Daily Advice)
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Daily HRV advice..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="rMSSD"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                rMSSD (HRV Recovery Metric)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="ms"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="rhr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                RHR (Resting Heart Rate)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="bpm"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trainerRoadLgt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-emerald-500" />
                                TR-LGT
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {lgtOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CollapsibleSection>
                    )}

                    {/* Reflection Section — Cycling only */}
                    {entryType === "cycling" && (
                    <CollapsibleSection
                      id="reflection"
                      title="Workout Reflection"
                      isOpen={sectionStates["reflection"]}
                      onOpenChange={(open) => setSection("reflection", open)}
                      hasData={
                        !!watchedValues.whatWentWell ||
                        !!watchedValues.whatCouldBeImproved ||
                        !!watchedValues.description
                      }
                    >

                      <FormField
                        control={form.control}
                        name="whatWentWell"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WWW (What Went Well)</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4} 
                                placeholder="• Enter each point on a new line&#10;• Use bullet points for better organization&#10;• Focus on positive aspects of the workout" 
                                className="resize-y"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatCouldBeImproved"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WCBI (What Could Be Improved)</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4} 
                                placeholder="• Enter each improvement area on a new line&#10;• Be specific about what could be better&#10;• Focus on actionable insights" 
                                className="resize-y"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                placeholder="Workout description, goals, intervals intensity and duration..."
                                className="resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleSection>
                    )}

                    {/* Rest Day Section — Rest only */}
                    {entryType === "rest" && (
                    <CollapsibleSection
                      id="rest-day"
                      title="Rest Day"
                      isOpen={sectionStates["rest-day"]}
                      onOpenChange={(open) => setSection("rest-day", open)}
                      hasData={
                        watchedValues.weight !== undefined || !!watchedValues.restNotes
                      }
                    >
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Scale className="w-4 h-4 text-purple-500" />
                              Weight
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="kg"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="restNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <NotebookPen className="w-4 h-4 text-blue-500" />
                              Notes
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={6}
                                placeholder="How are you feeling? Life context, decisions, mood..."
                                className="resize-y"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleSection>
                    )}

                    {/* Activity Section — Other only */}
                    {entryType === "other" && (
                    <CollapsibleSection
                      id="activity"
                      title="Activity"
                      isOpen={sectionStates["activity"]}
                      onOpenChange={(open) => setSection("activity", open)}
                      hasData={
                        !!watchedValues.activityGoal || !!watchedValues.activityNotes
                      }
                    >
                      <FormField
                        control={form.control}
                        name="activityGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              Activity
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., MFR, Yoga, Strength, Stretching"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="activityNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <NotebookPen className="w-4 h-4 text-blue-500" />
                              Notes
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={6}
                                placeholder="What did you do? Duration, areas worked, how it felt..."
                                className="resize-y"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Each line will be formatted as a bullet point</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleSection>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button type="button" className="flex-1 bg-brand-blue hover:bg-blue-700 text-white" onClick={handleCopyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Copy</span>
                        <span className="sm:hidden">Copy to Clipboard</span>
                      </Button>
                      <Button type="button" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button type="button" variant="outline" className="sm:flex-none" onClick={handleClearForm}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm xl:sticky xl:top-24 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Markdown Output</h2>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Live Preview</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-64 xl:min-h-96 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                    {markdownOutput || "Fill out the form to see your markdown preview here..."}
                  </pre>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center">
                    <Info className="inline w-4 h-4 mr-1 flex-shrink-0" />
                    Fill out the form to see your personalized markdown output here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
