import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

function renderSection(props: Partial<React.ComponentProps<typeof CollapsibleSection>> = {}) {
  const defaultProps = {
    id: "test-section",
    title: "Test Section",
    isOpen: true,
    onOpenChange: vi.fn(),
    children: <div data-testid="section-content">Section content</div>,
  };
  return render(<CollapsibleSection {...defaultProps} {...props} />);
}

describe("CollapsibleSection", () => {
  it("renders title and children", () => {
    renderSection();
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByTestId("section-content")).toBeInTheDocument();
  });

  it("children are present in DOM even when closed", () => {
    renderSection({ isOpen: false });
    // Content should be in DOM (just hidden by browser CSS for closed <details>)
    expect(screen.getByTestId("section-content")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const icon = <span data-testid="section-icon">★</span>;
    renderSection({ icon });
    expect(screen.getByTestId("section-icon")).toBeInTheDocument();
  });

  it("toggle event on details fires onOpenChange", () => {
    const onOpenChange = vi.fn();
    renderSection({ isOpen: true, onOpenChange });

    const details = document.getElementById("test-section") as HTMLDetailsElement;
    // Simulate browser closing the <details> element (browser sets .open before firing toggle)
    details.open = false;
    fireEvent(details, new Event("toggle"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("hasData indicator renders when hasData=true and isOpen=false", () => {
    renderSection({ hasData: true, isOpen: false });
    expect(screen.getByLabelText("Section contains data")).toBeInTheDocument();
  });

  it("hasData indicator does not render when isOpen=true", () => {
    renderSection({ hasData: true, isOpen: true });
    expect(screen.queryByLabelText("Section contains data")).not.toBeInTheDocument();
  });

  it("hasData indicator does not render when hasData=false", () => {
    renderSection({ hasData: false, isOpen: false });
    expect(screen.queryByLabelText("Section contains data")).not.toBeInTheDocument();
  });

  it("hasData indicator has accessible label", () => {
    renderSection({ hasData: true, isOpen: false });
    const indicator = screen.getByLabelText("Section contains data");
    expect(indicator).toBeInTheDocument();
  });

  it("details element has correct id", () => {
    renderSection({ id: "my-section" });
    expect(document.getElementById("my-section")).toBeInTheDocument();
  });

  it("details element is open when isOpen=true", () => {
    renderSection({ isOpen: true });
    const details = document.getElementById("test-section") as HTMLDetailsElement;
    expect(details.open).toBe(true);
  });

  it("details element is closed when isOpen=false", () => {
    renderSection({ isOpen: false });
    const details = document.getElementById("test-section") as HTMLDetailsElement;
    expect(details.open).toBe(false);
  });

  it("chevron rotates when open", () => {
    const { container } = renderSection({ isOpen: true });
    const chevron = container.querySelector("svg");
    expect(chevron).toHaveStyle({ transform: "rotate(180deg)" });
  });

  it("chevron is not rotated when closed", () => {
    const { container } = renderSection({ isOpen: false });
    const chevron = container.querySelector("svg");
    expect(chevron).toHaveStyle({ transform: "rotate(0deg)" });
  });
});
