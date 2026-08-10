import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Droplets } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

describe("StatCard", () => {
  it("renders the label, value and unit", () => {
    render(<StatCard label="Moisture" value={45} unit="%" icon={Droplets} />);
    expect(screen.getByText("Moisture")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("renders optional sub text when provided", () => {
    render(<StatCard label="pH" value={6.5} icon={Droplets} sub="Slightly acidic" />);
    expect(screen.getByText("Slightly acidic")).toBeInTheDocument();
  });

  it("omits the unit span entirely when no unit is given", () => {
    render(<StatCard label="Score" value={72} icon={Droplets} />);
    expect(screen.getByText("72")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});

describe("Progress", () => {
  it("clamps the bar width to 0-100 for out-of-range values", () => {
    const { container, rerender } = render(<Progress value={150} />);
    let bar = container.querySelector(".bg-primary") as HTMLElement;
    expect(bar.style.width).toBe("100%");

    rerender(<Progress value={-20} />);
    bar = container.querySelector(".bg-primary") as HTMLElement;
    expect(bar.style.width).toBe("0%");

    rerender(<Progress value={42} />);
    bar = container.querySelector(".bg-primary") as HTMLElement;
    expect(bar.style.width).toBe("42%");
  });
});
