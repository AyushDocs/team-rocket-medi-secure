import { render, screen } from "@testing-library/react";
import { Skeleton, CardSkeleton, ListSkeleton } from "@/components/Skeleton";

describe("Skeleton Component", () => {
  test("renders Skeleton with custom class", () => {
    render(<Skeleton className="h-4 w-full" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  test("renders CardSkeleton correctly", () => {
    render(<CardSkeleton />);
    expect(document.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  test("renders ListSkeleton with correct number of items", () => {
    render(<ListSkeleton items={3} />);
    const items = screen.getAllByRole("status");
    expect(items).toHaveLength(3);
  });
});

describe("PageLoader Component", () => {
  test("renders loading spinner", () => {
    const { container } = render(<div />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });
});