import { fireEvent, render } from "@testing-library/react-native";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductionCard } from "@/components/ProductionCard";
import { CATEGORIES } from "@/domain/catalog";

it("opens a catalog category from its accessible card", async () => {
  const onPress = jest.fn();
  const category = CATEGORIES[0];
  const screen = await render(
    <CategoryCard category={category} onPress={onPress} />,
  );

  const card = screen.getByRole("button");
  expect(card.props.accessibilityHint).toBe(`Open ${category.title} sessions`);
  expect(screen.getByText(category.description)).toBeTruthy();
  fireEvent.press(card);
  expect(onPress).toHaveBeenCalledTimes(1);
});

it("marks future catalog work as disabled and in production", async () => {
  const screen = await render(
    <ProductionCard
      accent="#8EA8C8"
      description="A future guided practice."
      id="guided-sleep"
      label="GUIDED"
      meta="Voice recording pending"
      title="Sleep guidance"
      wash="#F1ECE4"
    />,
  );

  const card = screen.getByTestId("production-card-guided-sleep");
  expect(card.props.accessibilityState).toEqual({ disabled: true });
  expect(screen.getByText("IN PRODUCTION")).toBeTruthy();
  expect(screen.getByText("Voice recording pending")).toBeTruthy();
});
