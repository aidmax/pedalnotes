import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "@/pages/home";

it("updates the cycling Markdown preview when environment readings are entered or cleared", () => {
  render(<Home />);
  const preview = screen.getByText("Fill out the form to see your markdown preview here...");
  fireEvent.click(screen.getByText("Environment"));
  const temperature = screen.getByRole("spinbutton", { name: /temperature/i });
  const humidity = screen.getByRole("spinbutton", { name: /humidity/i });
  const lines = () => preview.textContent?.split("\n");

  fireEvent.change(temperature, { target: { value: "0" } });
  fireEvent.change(humidity, { target: { value: "0" } });
  expect(lines()).toContain("Temp: 0 °C");
  expect(lines()).toContain("Hum: 0%");

  fireEvent.change(temperature, { target: { value: "" } });
  expect(preview).not.toHaveTextContent("Temp:");
  expect(lines()).toContain("Hum: 0%");

  fireEvent.change(temperature, { target: { value: "-2.5" } });
  fireEvent.change(humidity, { target: { value: "" } });
  expect(lines()).toContain("Temp: -2.5 °C");
  expect(preview).not.toHaveTextContent("Hum:");
});
